// 存储初始化状态管理
const initializeStatus = new Map();

export function isInitialized(namespace) {
    return initializeStatus.get(namespace) || false;
}

export function setInitialized(namespace) {
    initializeStatus.set(namespace, true);
}

export async function initialize(namespace, env, initFunction) {
    if (!isInitialized(namespace)) {
        console.log(`[Storage] Initializing ${namespace} storage`);
        try {
            await initFunction(env);
            setInitialized(namespace);
            console.log(`[Storage] ${namespace} storage initialized successfully`);
        } catch (error) {
            console.error(`[Storage] Error initializing ${namespace} storage:`, error);
            throw error;
        }
    } else {
        console.log(`[Storage] ${namespace} storage already initialized`);
    }
}
