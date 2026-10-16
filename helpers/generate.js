export function generateToken(length) {
    const characters = 
    `QWERTYUIOPASDFGHJKLZXCVBNMqwertyuiopasdfghjklzxcvbnm1234567890`;
    
    let token = '';
    for(let i = 0; i < length; i++) {
        token += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return token;
};

export function generateNumber(length) {
    const characters = 
    `1234567890`;
    
    let result = '';
    for(let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}