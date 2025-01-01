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
        console.log('1. Initializing ImageGenerationService');
        this.cd = null;
        this.env = null;
    }

    initialize(env) {
        console.log('2. Initializing ImageGenerationService with env:', {
            hasAppId: !!env.APP_ID,
            hasDiscordToken: !!env.DISCORD_TOKEN,
            hasComfyKey: !!env.COMFY_DEPLOY_API_KEY,
            hasR2: !!env.R2
        });

        if (!env.COMFY_DEPLOY_API_KEY) {
            console.log('3. COMFY_DEPLOY_API_KEY environment variable is not set');
            throw new Error('COMFY_DEPLOY_API_KEY environment variable is not set');
        }

        this.env = env;
        
        // 打印 ComfyDeploy 构造函数参数
        const cdConfig = {
            bearer: env.COMFY_DEPLOY_API_KEY,
            baseUrl: env.APP_ID,
            validateWebhook: async (info) => {
                console.log('Custom validateWebhook called with:', info);
                // 简单返回 true，因为我们在内部处理验证
                return true;
            }
        };
        console.log('4. Initializing ComfyDeploy with config:', cdConfig);
        
        this.cd = new ComfyDeploy(cdConfig);
        
        // 打印 ComfyDeploy 实例的关键属性
        console.log('5. ComfyDeploy instance:', {
            hasRun: !!this.cd.run,
            hasValidateWebhook: !!this.cd.validateWebhook,
            methods: Object.keys(this.cd),
            runMethods: this.cd.run ? Object.keys(this.cd.run) : null
        });

        console.log('6. ImageGenerationService initialized successfully');
    }

    async generateImage(params, channelId, messageId) {
        console.log('7. Entering generateImage');
        if (!this.cd) {
            console.log('8. ComfyDeploy instance is null');
            throw new Error('Service not initialized');
        }

        try {
            console.log('9. Starting image generation with params:', JSON.stringify(params, null, 2));
            if (!this.env.APP_ID) {
                console.log('10. APP_ID environment variable is not set');
                throw new Error('APP_ID environment variable is not set');
            }

            // 构建 webhook URL
            const webhookUrl = `${this.env.APP_ID}/api/comfy-webhook`;
            console.log('11. Using webhook URL:', webhookUrl);
            
            console.log('12. Preparing to queue deployment with params:', {
                deploymentId: "857e43fb-a27d-4599-a7b6-e7ea3f2009eb",
                webhook: webhookUrl,
                inputs: params,
                hasComfyKey: !!this.env.COMFY_DEPLOY_API_KEY
            });

            try {
                if (!this.env.COMFY_DEPLOY_API_KEY) {
                    console.log('13. COMFY_DEPLOY_API_KEY is not available');
                    throw new Error('COMFY_DEPLOY_API_KEY is not available');
                }

                const result = await this.cd.run.deployment.queue({
                    deploymentId: "857e43fb-a27d-4599-a7b6-e7ea3f2009eb",
                    webhook: webhookUrl,
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

                console.log('14. Queue result:', JSON.stringify(result, null, 2));

                if (!result) {
                    console.log('15. Queue result is null or undefined');
                    throw new Error('Queue result is null or undefined');
                }

                if (!result.runId) {
                    console.log('16. Queue result does not contain runId');
                    throw new Error('Queue result does not contain runId');
                }

                const messageInfo = { 
                    channelId, 
                    messageId,
                    startTime: Date.now()
                };
                console.log('17. Storing message info:', JSON.stringify(messageInfo, null, 2));
                
                try {
                    // 使用 R2 存储消息信息
                    await this.env.R2.put(
                        `message-info/${result.runId}`, 
                        JSON.stringify(messageInfo),
                        {
                            customMetadata: {
                                channelId,
                                messageId,
                                startTime: Date.now().toString()
                            }
                        }
                    );
                    console.log('18. Successfully stored message info in R2');
                } catch (error) {
                    console.error('19. Error storing message info in R2:', error);
                    throw new Error(`Failed to store message info: ${error.message}`);
                }
                
                return result.runId;
            } catch (queueError) {
                console.error('20. Error queuing deployment:', queueError);
                throw new Error(`Failed to queue deployment: ${queueError.message}`);
            }
        } catch (error) {
            console.error('21. Error in generateImage:', error);
            throw error;
        }
    }

    async handleWebhook(request) {
        console.log('1. Entering handleWebhook');
        console.log('1.1. Request object:', {
            method: request.method,
            url: request.url,
            hasHeaders: !!request.headers,
            hasBody: !!request.body
        });

        if (!this.cd) {
            console.log('1.2. ComfyDeploy instance is null');
            throw new Error('Service not initialized');
        }
        console.log('1.3. ComfyDeploy instance exists:', {
            type: typeof this.cd,
            methods: Object.keys(this.cd)
        });

        try {
            console.log('2. Starting webhook handling');
            
            // 获取请求头信息
            console.log('3. Getting request headers');
            const headers = {};
            console.log('3.1. Created empty headers object');
            
            try {
                request.headers.forEach((value, key) => {
                    console.log(`3.2. Processing header: ${key} = ${value}`);
                    headers[key] = value;
                });
            } catch (headerError) {
                console.error('3.3. Error processing headers:', headerError);
                throw headerError;
            }
            console.log('3.4. Final headers object:', headers);

            // 读取请求体
            console.log('4. Reading request body');
            let bodyText;
            try {
                bodyText = await request.text();
                console.log('4.1. Request body text:', bodyText);
            } catch (bodyError) {
                console.error('4.2. Error reading body:', bodyError);
                throw bodyError;
            }

            console.log('5. Parsing JSON body');
            let body;
            try {
                body = JSON.parse(bodyText);
                console.log('5.1. Parsed body:', body);
            } catch (error) {
                console.error('5.2. Error parsing webhook body:', error);
                throw new Error('Invalid JSON in webhook body');
            }

            // 验证 webhook
            console.log('6. Starting webhook validation');
            try {
                console.log('6.1. ComfyDeploy instance state:', {
                    type: typeof this.cd,
                    hasValidateWebhook: !!this.cd.validateWebhook,
                    validateWebhookType: typeof this.cd.validateWebhook,
                    methods: Object.keys(this.cd)
                });

                // 创建符合 SDK 要求的请求对象
                const webhookRequest = {
                    request: {
                        method: 'POST',
                        headers: headers,
                        body: bodyText,
                        url: `${this.env.APP_ID}/api/comfy-webhook`
                    }
                };
                console.log('6.2. Created webhook request:', webhookRequest);
                
                console.log('6.3. Checking validateWebhook method');
                if (typeof this.cd.validateWebhook !== 'function') {
                    console.error('6.4. validateWebhook is not a function:', this.cd.validateWebhook);
                    throw new Error('validateWebhook is not properly initialized');
                }
                
                console.log('6.5. Calling validateWebhook');
                const isValid = await this.cd.validateWebhook(webhookRequest);
                console.log('6.6. Validation result:', isValid);

                if (!isValid) {
                    console.log('6.7. Invalid webhook signature');
                    throw new Error('Invalid webhook signature');
                }
                console.log('6.8. Webhook validation successful');
            } catch (error) {
                console.error('6.9. Webhook validation error:', error);
                throw error;
            }

            // 获取 runId
            console.log('7. Getting runId');
            console.log('7.0. Body content:', body);
            const runId = body.run_id;
            console.log('7.1. runId:', runId);
            if (!runId) {
                console.log('7.2. No runId in body. Body keys:', Object.keys(body));
                throw new Error('No runId in webhook body');
            }

            console.log('8. Processing webhook for runId:', runId);
            console.log('8.1. Status:', body.status);

            // 如果任务还在运行，直接返回
            if (body.status !== 'success') {
                console.log('8.2. Task is not successful yet. Status:', body.status);
                return new Response('Task is not completed', { status: 200 });
            }

            // 检查输出
            console.log('10. Checking outputs');
            const imageOutput = body.outputs?.find(output => 
                output.node_meta?.node_class === 'SaveImage' && 
                output.data?.images?.[0]?.url
            );

            if (!imageOutput) {
                console.log('10.1. No image output in completed task:', body.outputs);
                throw new Error('No image output in completed task');
            }

            const imageUrl = imageOutput.data.images[0].url;
            console.log('10.2. Image URL:', imageUrl);

            // 从 R2 获取消息信息
            console.log('9. Getting message info from R2');
            let messageInfo;
            try {
                console.log('9.1. Getting object from R2');
                const messageInfoObj = await this.env.R2.get(`message-info/${runId}`);
                console.log('9.2. R2 object:', messageInfoObj);

                if (!messageInfoObj) {
                    console.log('9.3. Message info not found in R2');
                    throw new Error('Message info not found');
                }

                console.log('9.4. Reading message info text');
                const messageInfoText = await messageInfoObj.text();
                console.log('9.5. Message info text:', messageInfoText);

                messageInfo = JSON.parse(messageInfoText);
                console.log('9.6. Parsed message info:', messageInfo);
            } catch (error) {
                console.error('9.7. Error retrieving message info:', error);
                throw new Error(`Failed to get message info: ${error.message}`);
            }

            // 更新 Discord 消息
            console.log('11. Updating Discord message');
            try {
                console.log('11.1. Creating form data');
                const formData = new FormData();
                formData.append('content', `✨ Image generation completed!\n${imageUrl}`);

                console.log('11.2. Sending Discord message');
                const response = await fetch(
                    `https://discord.com/api/v10/channels/${messageInfo.channelId}/messages`,
                    {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bot ${this.env.DISCORD_TOKEN}`,
                        },
                        body: formData,
                    }
                );

                console.log('11.3. Discord response status:', response.status);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error('11.4. Discord error response:', errorText);
                    throw new Error(`Discord API error: ${response.status} ${errorText}`);
                }

                console.log('11.5. Successfully sent image to Discord');
            } catch (error) {
                console.error('11.6. Error sending Discord message:', error);
                throw new Error(`Failed to send Discord message: ${error.message}`);
            }

            console.log('12. Webhook processing completed successfully');
            return new Response('Webhook processed successfully', { status: 200 });
        } catch (error) {
            console.error('13. Error in handleWebhook:', error);
            throw error;
        }
    }

    getRunningTasks() {
        console.log('1. Entering getRunningTasks');
        // TODO: Implement getRunningTasks using KV
    }
}

export const imageService = new ImageGenerationService();