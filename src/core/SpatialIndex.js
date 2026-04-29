import RBush from 'rbush';

class SpatialIndex {
    constructor() {
        this.rtree = new RBush(9); // 9叉树
        this.entityMap = new Map(); // 实体ID到实体的映射
        this.nextId = 0;
    }

    /**
     * 添加实体到空间索引
     * @param {Object} entity - 实体对象（需要有position和collisionBox）
     */
    insert(entity) {
        const box = entity.getCollisionBox ? entity.getCollisionBox() : null;
        if (!box) return;

        const id = this.nextId++;
        const item = {
            id: id,
            minX: box.min?.x ?? box.minX,
            minY: box.min?.z ?? box.minZ,
            maxX: box.max?.x ?? box.maxX,
            maxY: box.max?.z ?? box.maxZ,
            entity: entity
        };

        this.rtree.insert(item);
        this.entityMap.set(id, entity);

        return id;
    }

    /**
     * 从空间索引移除实体
     */
    remove(entity) {
        const itemsToRemove = [];
        
        this.rtree.all().forEach(item => {
            if (item.entity === entity) {
                itemsToRemove.push(item);
            }
        });

        itemsToRemove.forEach(item => {
            this.rtree.remove(item);
            this.entityMap.delete(item.id);
        });
    }

    /**
     * 查询指定点附近的实体
     * @param {number} x - X坐标
     * @param {number} z - Z坐标
     * @param {number} tolerance - 容差范围（默认2.0）
     * @returns {Array} - 按距离排序的实体列表
     */
    queryPoint(x, z, tolerance = 2.0) {
        const searchBox = {
            minX: x - tolerance,
            minY: z - tolerance,
            maxX: x + tolerance,
            maxY: z + tolerance
        };

        const results = this.rtree.search(searchBox);
        
        // 按距离排序（从近到远）
        results.sort((a, b) => {
            const distA = this._distanceToPoint(x, z, a);
            const distB = this._distanceToPoint(x, z, b);
            return distA - distB;
        });

        return results.map(item => item.entity);
    }

    /**
     * 查询指定矩形区域内的实体
     */
    queryRect(minX, minZ, maxX, maxZ) {
        const searchBox = { minX, minY: minZ, maxX, maxY: maxZ };
        const results = this.rtree.search(searchBox);
        return results.map(item => item.entity);
    }

    /**
     * 清空空间索引
     */
    clear() {
        this.rtree.clear();
        this.entityMap.clear();
        this.nextId = 0;
    }

    /**
     * 计算点到矩形中心的距离
     */
    _distanceToPoint(x, z, item) {
        const centerX = (item.minX + item.maxX) / 2;
        const centerZ = (item.minY + item.maxY) / 2;
        return Math.sqrt((x - centerX) ** 2 + (z - centerZ) ** 2);
    }

    /**
     * 获取索引中的所有实体数量
     */
    size() {
        return this.rtree.all().length;
    }

    /**
     * 更新实体的空间索引位置
     */
    update(entity) {
        this.remove(entity);
        this.insert(entity);
    }
}

export default SpatialIndex;
