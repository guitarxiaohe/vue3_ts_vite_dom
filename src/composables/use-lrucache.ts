/**
 * 双向链表节点
 */
class DoublyListNode<T> {
  data: T;
  prev: DoublyListNode<T> | null = null;
  next: DoublyListNode<T> | null = null;

  constructor(data: T) {
    this.data = data;
  }
}

/**
 * 双向链表
 */
export class DoublyLinkedList<T> {
  private head: DoublyListNode<T> | null = null;
  private tail: DoublyListNode<T> | null = null;
  private _size = 0;

  /**
   * 获取链表长度
   */
  get size(): number {
    return this._size;
  }

  /**
   * 判断链表是否为空
   */
  get isEmpty(): boolean {
    return this._size === 0;
  }

  /**
   * 获取头节点数据
   */
  get first(): T | null {
    return this.head?.data ?? null;
  }

  /**
   * 获取尾节点数据
   */
  get last(): T | null {
    return this.tail?.data ?? null;
  }

  /**
   * 在头部插入
   */
  prepend(data: T): DoublyListNode<T> {
    const node = new DoublyListNode(data);

    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head.prev = node;
      this.head = node;
    }

    this._size++;
    return node;
  }

  /**
   * 在尾部插入
   */
  append(data: T): DoublyListNode<T> {
    const node = new DoublyListNode(data);

    if (!this.tail) {
      this.head = node;
      this.tail = node;
    } else {
      node.prev = this.tail;
      this.tail.next = node;
      this.tail = node;
    }

    this._size++;
    return node;
  }

  /**
   * 在指定节点后插入
   */
  insertAfter(node: DoublyListNode<T>, data: T): DoublyListNode<T> {
    const newNode = new DoublyListNode(data);

    newNode.prev = node;
    newNode.next = node.next;

    if (node.next) {
      node.next.prev = newNode;
    } else {
      this.tail = newNode;
    }

    node.next = newNode;
    this._size++;
    return newNode;
  }

  /**
   * 删除指定节点
   */
  remove(node: DoublyListNode<T>): T {
    if (node.prev) {
      node.prev.next = node.next;
    } else {
      this.head = node.next;
    }

    if (node.next) {
      node.next.prev = node.prev;
    } else {
      this.tail = node.prev;
    }

    node.prev = null;
    node.next = null;
    this._size--;

    return node.data;
  }

  /**
   * 移动节点到头部
   */
  moveToHead(node: DoublyListNode<T>): void {
    if (node === this.head) return;

    this.remove(node);
    const newNode = this.prepend(node.data);
    // 更新引用
    Object.assign(node, newNode);
  }

  /**
   * 移动节点到尾部
   */
  moveToTail(node: DoublyListNode<T>): void {
    if (node === this.tail) return;

    this.remove(node);
    const newNode = this.append(node.data);
    Object.assign(node, newNode);
  }

  /**
   * 从头部删除
   */
  removeFirst(): T | null {
    if (!this.head) return null;
    return this.remove(this.head);
  }

  /**
   * 从尾部删除
   */
  removeLast(): T | null {
    if (!this.tail) return null;
    return this.remove(this.tail);
  }

  /**
   * 清空链表
   */
  clear(): void {
    this.head = null;
    this.tail = null;
    this._size = 0;
  }

  /**
   * 查找节点
   */
  find(predicate: (data: T) => boolean): DoublyListNode<T> | null {
    let current = this.head;
    while (current) {
      if (predicate(current.data)) {
        return current;
      }
      current = current.next;
    }
    return null;
  }

  /**
   * 转为数组（正序）
   */
  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.data);
      current = current.next;
    }
    return result;
  }

  /**
   * 转为数组（倒序）
   */
  toReversedArray(): T[] {
    const result: T[] = [];
    let current = this.tail;
    while (current) {
      result.push(current.data);
      current = current.prev;
    }
    return result;
  }

  /**
   * 遍历（正序）
   */
  forEach(callback: (data: T, index: number) => void): void {
    let current = this.head;
    let index = 0;
    while (current) {
      callback(current.data, index++);
      current = current.next;
    }
  }

  /**
   * 遍历（倒序）
   */
  forEachReverse(callback: (data: T, index: number) => void): void {
    let current = this.tail;
    let index = 0;
    while (current) {
      callback(current.data, index++);
      current = current.prev;
    }
  }

  /**
   * 映射
   */
  map<U>(callback: (data: T, index: number) => U): U[] {
    const result: U[] = [];
    this.forEach((data, index) => {
      result.push(callback(data, index));
    });
    return result;
  }

  /**
   * 过滤
   */
  filter(predicate: (data: T, index: number) => boolean): T[] {
    const result: T[] = [];
    this.forEach((data, index) => {
      if (predicate(data, index)) {
        result.push(data);
      }
    });
    return result;
  }
}

/**
 * LRU 缓存（基于双向链表）
 */
export class LRUCache<K, V> {
  private cache = new Map<K, DoublyListNode<{ key: K; value: V }>>();
  private list = new DoublyLinkedList<{ key: K; value: V }>();
  private _maxSize: number;

  constructor(maxSize: number) {
    this._maxSize = maxSize;
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.list.size;
  }

  /**
   * 获取最大容量
   */
  get maxSize(): number {
    return this._maxSize;
  }

  /**
   * 获取缓存值
   */
  get(key: K): V | undefined {
    const node = this.cache.get(key);
    if (!node) return undefined;

    // 移动到头部（最近使用）
    this.list.moveToHead(node);
    return node.data.value;
  }

  /**
   * 设置缓存
   */
  set(key: K, value: V): void {
    const existingNode = this.cache.get(key);

    if (existingNode) {
      // 更新值并移动到头部
      existingNode.data.value = value;
      this.list.moveToHead(existingNode);
      return;
    }

    // 超出容量，淘汰尾部
    if (this.list.size >= this._maxSize) {
      const tail = this.list.last;
      if (tail) {
        this.cache.delete(tail.key);
        this.list.removeLast();
      }
    }

    // 插入新节点
    const newNode = this.list.prepend({ key, value });
    this.cache.set(key, newNode);
  }

  /**
   * 删除缓存
   */
  delete(key: K): boolean {
    const node = this.cache.get(key);
    if (!node) return false;

    this.cache.delete(key);
    this.list.remove(node);
    return true;
  }

  /**
   * 检查是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear();
    this.list.clear();
  }

  /**
   * 获取所有键
   */
  keys(): K[] {
    return this.list.map((item) => item.key);
  }

  /**
   * 获取所有值
   */
  values(): V[] {
    return this.list.map((item) => item.value);
  }

  /**
   * 获取所有条目
   */
  entries(): [K, V][] {
    return this.list.map((item) => [item.key, item.value]);
  }
}

/**
 * 创建 LRU 缓存
 */
export function useLRUCache<K, V>(maxSize: number) {
  return new LRUCache<K, V>(maxSize);
}
