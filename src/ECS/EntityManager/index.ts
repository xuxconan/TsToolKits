//       type reuse            index
// int32 [][] [][][][][][][][] [][][][][][][][][][][][][][][][][][][][][][]

const ENTITY_TYPE_BITS = 2;
const ENTITY_TYPE_MASK = (1 << ENTITY_TYPE_BITS) - 1;
const ENTITY_INDEX_BITS = 22;
const ENTITY_INDEX_MASK = (1 << ENTITY_INDEX_BITS) - 1;
const ENTITY_REUSE_BITS = 8;
const ENTITY_REUSE_MASK = (1 << ENTITY_REUSE_BITS) - 1;

const MINIMUM_FREE_INDICES = 1 << 10; // 允许重用index的最低数量

interface IEntity {
  Id: number; // id
  Type: number; // 类型（预留的字段）
  Reuse: number; // index被重用的次数
  Index: number; // 递增，实体index
}

class EntityManager {
  reuseList: number[] = []; // 重用次数列表，角标对应实体index
  freeIndices: number[] = []; // 可重用index

  Create() {
    const reuseList = this.reuseList;
    const freeIndices = this.freeIndices;
    let idx;
    if (freeIndices.length > MINIMUM_FREE_INDICES) {
      idx = freeIndices.shift();
    } else {
      reuseList.push(0);
      idx = reuseList.length - 1;
      // 确保创建的实体不会超出index的位数（一般用不到这么多）
      if (idx >= 1 << ENTITY_INDEX_BITS) idx = (1 << ENTITY_INDEX_BITS) - 1;
    }

    const id = (reuseList[idx] << ENTITY_INDEX_BITS) + idx; // 暂时不考虑type
    const entity: IEntity = Object.create(null); // 创建一个没有原型的对象减少内存占用
    Object.defineProperties(entity, {
      Id: {
        get() {
          return id;
        },
      },
      Type: {
        get() {
          return (
            (id >> (ENTITY_INDEX_BITS + ENTITY_REUSE_BITS)) & ENTITY_TYPE_MASK
          );
        },
      },
      Reuse: {
        get() {
          return (id >> ENTITY_INDEX_BITS) & ENTITY_REUSE_MASK;
        },
      },
      Index: {
        get() {
          return id & ENTITY_INDEX_MASK;
        },
      },
    });
    return entity;
  }

  Alive(e: IEntity) {
    return this.reuseList[e.Index] === e.Reuse; // 重用次数与实体当前重用次数一致才是有效实体
  }

  Dispose(e: IEntity) {
    const index = e.Index;
    let reuse = this.reuseList[index];
    reuse++; // 重用次数加一
    if (reuse >= 1 << ENTITY_REUSE_BITS) reuse = 0; // 当重用次数已占满重用位数时重置为0
    this.reuseList[index] = reuse;
    this.freeIndices.push(index); // index加入到可重用列表
  }
}
