// 存储初始化状态管理
const initializeStatus = new Map();

export function isInitialized(namespace) {
    return initializeStatus.get(namespace) || false;
}

export function setInitialized(namespace) {
    initializeStatus.set(namespace, true);
}

export function initialize(namespace, env, initFunction) {
    if (!isInitialized(namespace)) {
        console.log(`Initializing storage for ${namespace}`);
        initFunction(env);
        setInitialized(namespace);
    }
}
