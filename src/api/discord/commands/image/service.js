import { ComfyDeploy } from 'comfydeploy';

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
    }

    initialize(env) {
        if (!env.COMFY_DEPLOY_API_KEY) {
            throw new Error('COMFY_DEPLOY_API_KEY environment variable is not set');
        }

        this.env = env;
        this.webhookUrl = `${env.APP_ID}/comfy-webhook`;
        const cdConfig = {
            bearer: env.COMFY_DEPLOY_API_KEY,
            baseUrl: env.APP_ID,
            validateWebhook: async (info) => {
                return true;
            }
        };
        
        this.cd = new ComfyDeploy(cdConfig);
    }

    async generateImage(params, channelId, messageId, userId, guildId) {
        if (!this.cd) {
            throw new Error('Service not initialized');
        }

        try {
            if (!this.env.APP_ID) {
                throw new Error('APP_ID environment variable is not set');
            }
            
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
                channelId, 
                messageId,
                userId,
                guildId,
                startTime: Date.now()
            };
            
            await this.env.R2.put(
                `message-info/${result.runId}`, 
                JSON.stringify(messageInfo),
                {
                    customMetadata: {
                        channelId,
                        messageId,
                        userId,
                        guildId,
                        startTime: Date.now().toString()
                    }
                }
            );
            
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
                await this.env.R2.put(r2ImageKey, imageBlob, {
                    httpMetadata: {
                        contentType: imageResponse.headers.get('content-type'),
                    }
                });

                // 构建 R2 URL
                const r2ImageUrl = `https://${this.env.R2_BUCKET_NAME}.r2.dev/${r2ImageKey}`;

                // 保存信息到数据库
                const imageInfo = {
                    run_id: runId,
                    user_id: messageInfo.userId || '',
                    guild_id: messageInfo.guildId || '',
                    channel_id: messageInfo.channelId || '',
                    created_at: new Date().toISOString(),
                    image_path: r2ImageKey || '',
                    original_url: originalImageUrl || '',
                    r2_url: r2ImageUrl || '',
                    prompt: body.workflow_inputs?.prompt || '',
                    parameters: JSON.stringify(body.workflow_inputs || {})
                };

                // 检查所有必需字段
                const requiredFields = ['run_id', 'user_id', 'guild_id', 'channel_id', 'created_at', 'image_path', 'original_url', 'r2_url'];
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
                    imageInfo.channel_id,
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
            }

            const formData = new FormData();
            formData.append('content', content);


            console.log('channel id', messageInfo.channelId);
            console.log('message id', messageInfo.messageId);
            console.log('user id', messageInfo.userId);
            console.log('guild id', messageInfo.guildId);

            const response = await fetch(
                `https://discord.com/api/v10/channels/${messageInfo.channelId}/messages/${messageInfo.messageId}`,
                {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bot ${this.env.DISCORD_TOKEN}`,
                    },
                    body: formData,
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Discord API error: ${response.status} ${errorText}`);
            }

            return new Response('Webhook processed successfully', { status: 200 });
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