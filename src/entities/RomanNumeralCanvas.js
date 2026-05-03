/**
 * 罗马数字Canvas绘制工具
 * 用于绘制城镇中心的时代罗马数字
 */

class RomanNumeralCanvas {
    /**
     * 创建罗马数字纹理
     * @param {number} ageLevel - 时代等级 (1-4)
     * @param {number} size - canvas尺寸，默认256
     * @returns {THREE.CanvasTexture}
     */
    static createTexture(ageLevel, size = 256) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        // 清除画布
        ctx.clearRect(0, 0, size, size);

        // 绘制罗马数字
        const romanNumerals = ['I', 'II', 'III', 'IV'];
        const numeral = romanNumerals[Math.min(Math.max(ageLevel - 1, 0), 3)] || 'I';

        // 设置字体 - 使用更大的字体尺寸
        const fontSize = size * 1.2; // 更大的字体
        ctx.font = `bold ${fontSize}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 设置文字颜色
        ctx.fillStyle = '#FFFFFF';
        
        // 添加文字阴影/描边效果使其更清晰
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.lineWidth = 4;
        
        // 先绘制描边，再绘制填充
        ctx.strokeText(numeral, size / 2, size / 2);
        ctx.fillText(numeral, size / 2, size / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        return texture;
    }

    /**
     * 更新现有纹理
     * @param {THREE.Mesh} mesh - 符号平面mesh
     * @param {number} ageLevel - 时代等级 (1-4)
     */
    static updateTexture(mesh, ageLevel) {
        if (!mesh || !mesh.material) return;

        const texture = RomanNumeralCanvas.createTexture(ageLevel);
        mesh.material.map = texture;
        mesh.material.needsUpdate = true;
    }
}

export default RomanNumeralCanvas;