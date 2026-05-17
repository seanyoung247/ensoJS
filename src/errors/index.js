
import en from './en';

export default (code, data) => {
    const text = en[code];
    if (!text) return `${code}: ${data}`
    
    return text(data);
}
