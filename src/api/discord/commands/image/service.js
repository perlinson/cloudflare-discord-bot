import { ComfyDeploy } from 'comfydeploy';
import { Logger } from '../../utils/Logger.js';
import { EmbedBuilder } from '../../utils/EmbedBuilder.js';
import { ComponentBuilder } from '../../utils/ComponentBuilder.js';
import { MessageBuilder } from '../../utils/MessageBuilder.js';
import { DiscordClient } from '../../client/index.js';

const DEPLOYMENT_ID = '857e43fb-a27d-4599-a7b6-e7ea3f2009eb';
const DEFAULT_PARAMS = {
    aspect_ratio: '1:1 square 1024x1024',
    sampler: 'euler',
    scheduler: 'simple',
    steps: 8,
    guidance: 3.5,
    seed: 0
};

export class ImageGenerationService {
    constructor() {
        this.cd = null;
        this.env = null;
        this.webhookUrl = null;
        this.logger = new Logger({ prefix: "ImageGenerationService" });
    }

    initialize(env) {
        if (!env.COMFY_DEPLOY_API_KEY) {
            throw new Error('COMFY_DEPLOY_API_KEY environment variable is not set');
        }
        if (!env.R2) {
            throw new Error('R2 bucket binding is not configured');
        }
        if (!env.R2_BUCKET_NAME) {
            env.R2_BUCKET_NAME = 'globalcord-storage';  // Use the bucket name from wrangler.toml
        }

        this.env = env;
        this.webhookUrl = `${env.APP_ID}/api/comfy-webhook`;
        const cdConfig = {
            bearer: env.COMFY_DEPLOY_API_KEY,
            baseUrl: env.APP_ID,
            validateWebhook: async (info) => {
                return true;
            }
        };
        
        this.cd = new ComfyDeploy(cdConfig);
        this.logger.info('ImageGenerationService initialized with:', {
            webhookUrl: this.webhookUrl,
            r2Configured: !!this.env.R2,
            r2BucketName: this.env.R2_BUCKET_NAME
        });
    }

    async generateImage(params, interaction_id, interaction_token, userId, guildId) {
        if (!this.cd) {
            throw new Error('Service not initialized');
        }

        this.logger.info('Generating image with params:', interaction_id, userId, guildId);

        try {
            if (!this.env.APP_ID) {
                throw new Error('APP_ID environment variable is not set');
            }
            this.logger.info('Generating image...', this.webhookUrl);
            const result = await this.cd.run.deployment.queue({
                deploymentId: "857e43fb-a27d-4599-a7b6-e7ea3f2009eb",
                webhook: this.webhookUrl,
                webhookIntermediateStatus: true,
                inputs: {
                    "prompt": params.prompt,
                    "aspect_ratio": params.aspect_ratio,
                    "seed": params.seed,
                    "steps": params.steps,
                    "sampler": params.sampler,
                    "scheduler": params.scheduler,
                    "guidance": params.guidance
                }
            });

            if (!result) {
                throw new Error('Queue result is null or undefined');
            }

            if (!result.runId) {
                throw new Error('Queue result does not contain runId');
            }

            const messageInfo = { 
                interaction_id, 
                interaction_token,
                userId,
                guildId,
                startTime: Date.now()
            };
            
            await this.env.R2.put(
                `message-info/${result.runId}`, 
                JSON.stringify(messageInfo),
                {
                    customMetadata: {
                        interaction_id,
                        interaction_token,
                        userId,
                        guildId,
                        startTime: Date.now().toString()
                    }
                }
            );
            
            this.logger.info('Image generation started with runId:', result.runId);

            return result.runId;
        } catch (error) {
            throw error;
        }
    }

    async handleWebhook(request) {
        if (!this.cd) {
            throw new Error('Service not initialized');
        }

        try {
            const headers = {};
            request.headers.forEach((value, key) => {
                headers[key] = value;
            });

            const bodyText = await request.text();
            const body = JSON.parse(bodyText);

            const webhookRequest = {
                request: {
                    method: 'POST',
                    headers: headers,
                    body: bodyText,
                    url: this.webhookUrl
                }
            };
            
            const isValid = await this.cd.validateWebhook(webhookRequest);
            if (!isValid) {
                throw new Error('Invalid webhook signature');
            }

            const runId = body.run_id;
            if (!runId) {
                throw new Error('No runId in webhook body');
            }

            const messageInfoObj = await this.env.R2.get(`message-info/${runId}`);
            if (!messageInfoObj) {
                throw new Error('Message info not found');
            }

            const messageInfo = JSON.parse(await messageInfoObj.text());

            let content = '';
            if (body.status === 'not-started') {
                content = '正在排队中...';
            } else if (body.status !== 'success') {
                const progress = Math.round(body.progress * 100);
                content = `正在生成图片... ${progress}%\n${body.live_status || ''}`;
            } else {
                const imageOutput = body.outputs?.find(output => 
                    output.node_meta?.node_class === 'SaveImage' && 
                    output.data?.images?.[0]?.url
                );

                if (!imageOutput) {
                    throw new Error('No image output in completed task');
                }

                const originalImageUrl = imageOutput.data.images[0].url;
                const fileExtension = originalImageUrl.split('.').pop();
                const r2ImageKey = `images/${runId}.${fileExtension}`;

                // 下载原始图片
                const imageResponse = await fetch(originalImageUrl);
                if (!imageResponse.ok) {
                    throw new Error('Failed to download image');
                }

                // 保存到 R2
                const imageBlob = await imageResponse.blob();
                this.logger.info('Saving image to R2:', {
                    r2ImageKey,
                    contentType: imageResponse.headers.get('content-type'),
                    size: imageBlob.size
                });

                try {
                    await this.env.R2.put(r2ImageKey, imageBlob, {
                        httpMetadata: {
                            contentType: imageResponse.headers.get('content-type'),
                        }
                    });
                    this.logger.info('Successfully saved image to R2');
                } catch (error) {
                    this.logger.error('Failed to save image to R2:', error);
                    throw new Error(`Failed to save image to R2: ${error.message}`);
                }

                // 构建 R2 URL
                const r2ImageUrl = `https://${this.env.R2_BUCKET_NAME}.r2.dev/${r2ImageKey}`;
                this.logger.info('Generated R2 URL:', r2ImageUrl);

                // 保存信息到数据库
                const imageInfo = {
                    run_id: runId,
                    user_id: messageInfo.userId || '',
                    guild_id: messageInfo.guildId || '',
                    interaction_id: messageInfo.interaction_id || '',
                    created_at: new Date().toISOString(),
                    image_path: r2ImageKey || '',
                    original_url: originalImageUrl || '',
                    r2_url: r2ImageUrl || '',
                    prompt: body.workflow_inputs?.prompt || '',
                    parameters: JSON.stringify(body.workflow_inputs || {})
                };

                // 检查所有必需字段
                const requiredFields = ['run_id', 'user_id', 'guild_id', 'interaction_id', 'created_at', 'image_path', 'original_url', 'r2_url'];
                for (const field of requiredFields) {
                    if (!imageInfo[field]) {
                        throw new Error(`Missing required field: ${field}`);
                    }
                }

                const { success } = await this.env.DB.prepare(`
                    INSERT INTO generated_images (
                        run_id, user_id, guild_id, channel_id, 
                        created_at, image_path, original_url, r2_url,
                        prompt, parameters
                    ) VALUES (
                        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
                    )
                `).bind(
                    imageInfo.run_id,
                    imageInfo.user_id,
                    imageInfo.guild_id,
                    imageInfo.interaction_id,
                    imageInfo.created_at,
                    imageInfo.image_path,
                    imageInfo.original_url,
                    imageInfo.r2_url,
                    imageInfo.prompt,
                    imageInfo.parameters
                ).run();

                if (!success) {
                    throw new Error('Failed to save image info to database');
                }

                content = `图片生成完成！\n${r2ImageUrl}`;


                const embed  = new EmbedBuilder()
                .setImage(r2ImageUrl)
                .setColor('#0099ff');

                const components = new ComponentBuilder();

                components.addActionRow()
                .addButton({
                    label: '查看原图',
                    url: originalImageUrl,
                    style: 'LINK'
                })
                .addButton({
                    label: '查看生成图',
                    url: r2ImageUrl,
                    style: 'LINK'
                });

                


                const message = new MessageBuilder()
                .setEmbed(embed.data)
                .setComponents(components.components)
                .setEphemeral(true);



                console.log('channel id', messageInfo.interaction_id);
                console.log('message id', messageInfo.interaction_token);
                console.log('user id', messageInfo.userId);
                console.log('guild id', messageInfo.guildId);

                console.log('Message info:', {
                    interaction_id: messageInfo.interaction_id,
                    interaction_token: messageInfo.interaction_token,
                    content,
                    r2ImageUrl,
                    originalImageUrl
                });

                const client = new DiscordClient(this.env.DISCORD_TOKEN, {}, this.env);

                const response = await client.interactions.editReply(messageInfo.interaction_id, messageInfo.interaction_token,
                    {
                        embeds: [{
                            title: '🎨 AI 图片生成',
                            description: content,
                            image: { url: r2ImageUrl },
                            color: 0x0099ff,
                            timestamp: new Date().toISOString()
                        }],
                        components: [{
                            type: 1,
                            components: [
                                {
                                    type: 2,
                                    label: '查看原图',
                                    style: 5,
                                    url: originalImageUrl
                                },
                                {
                                    type: 2,
                                    label: '查看生成图',
                                    style: 5,
                                    url: r2ImageUrl
                                }
                            ]
                        }]
                    }
                );

                console.log('Response:', response);
                return response
            }
        } catch (error) {
            throw error;
        }
    }

    getRunningTasks() {
        console.log('1. Entering getRunningTasks');
        // TODO: Implement getRunningTasks using KV
    }
}

export const imageService = new ImageGenerationService();