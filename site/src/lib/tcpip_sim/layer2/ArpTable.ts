/**
 * ARPテーブル (ARP Cache)
 *
 * IPアドレスからMACアドレスへのマッピングを管理する。
 * 実際のOSと同様に、エントリにはタイムアウト（エージング）が設定される。
 *
 * エントリの状態:
 * - INCOMPLETE: ARP Requestを送信済みだが、Replyをまだ受け取っていない
 * - REACHABLE: ARP Replyを受信し、MACアドレスが確定している
 * - STALE: 一定時間経過し、再確認が必要な可能性がある
 */

// ========================================
// ARPエントリの状態
// ========================================

/**
 * ARPエントリの状態
 */
export enum ArpEntryState {
  /** ARP Request送信済み、Reply待ち */
  INCOMPLETE = 'INCOMPLETE',
  /** 有効なエントリ（通信可能） */
  REACHABLE = 'REACHABLE',
  /** 期限切れ（再確認推奨） */
  STALE = 'STALE',
}

// ========================================
// ARPエントリ
// ========================================

/**
 * ARPテーブルの1エントリ
 */
export interface ArpEntry {
  /** IPアドレス（キー） */
  ipAddress: string;
  /** MACアドレス（INCOMPLETEの場合は空文字） */
  macAddress: string;
  /** エントリの状態 */
  state: ArpEntryState;
  /** 登録時刻（Unix timestamp in ms） */
  createdAt: number;
  /** 最終更新時刻（Unix timestamp in ms） */
  updatedAt: number;
}

// ========================================
// ARPテーブル設定
// ========================================

/**
 * ARPテーブルの設定
 */
export interface ArpTableConfig {
  /** エントリの有効期限（ミリ秒）。デフォルト: 300000ms (5分) */
  timeout: number;
  /** INCOMPLETEエントリの有効期限（ミリ秒）。デフォルト: 3000ms (3秒) */
  incompleteTimeout: number;
  /** 最大エントリ数。デフォルト: 512 */
  maxEntries: number;
}

const DEFAULT_CONFIG: ArpTableConfig = {
  timeout: 300000,          // 5分
  incompleteTimeout: 3000,  // 3秒
  maxEntries: 512,
};

// ========================================
// ARPテーブル クラス
// ========================================

/**
 * ARPテーブル
 *
 * IPアドレスからMACアドレスへのマッピングを管理する。
 *
 * @example
 * const arpTable = new ArpTable();
 *
 * // MACアドレスを登録
 * arpTable.update('192.168.1.10', 'AA:BB:CC:DD:EE:FF');
 *
 * // MACアドレスを検索
 * const mac = arpTable.lookup('192.168.1.10');
 * console.log(mac); // 'AA:BB:CC:DD:EE:FF'
 */
export class ArpTable {
  /** IPアドレス -> ARPエントリ のマッピング */
  private entries: Map<string, ArpEntry> = new Map();

  /** 設定 */
  private config: ArpTableConfig;

  constructor(config: Partial<ArpTableConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // ========================================
  // 検索系
  // ========================================

  /**
   * IPアドレスからMACアドレスを検索
   *
   * @param ipAddress 検索するIPアドレス
   * @returns MACアドレス（見つからない/INCOMPLETE/期限切れの場合はnull）
   */
  lookup(ipAddress: string): string | null {
    const entry = this.entries.get(ipAddress);
    if (!entry) return null;

    // 期限切れチェック
    if (this.isExpired(entry)) {
      this.entries.delete(ipAddress);
      return null;
    }

    // INCOMPLETEの場合はnull
    if (entry.state === ArpEntryState.INCOMPLETE) {
      return null;
    }

    return entry.macAddress;
  }

  /**
   * エントリの状態を取得
   *
   * @param ipAddress 検索するIPアドレス
   * @returns ARPエントリ（見つからない場合はnull）
   */
  getEntry(ipAddress: string): ArpEntry | null {
    const entry = this.entries.get(ipAddress);
    if (!entry) return null;

    if (this.isExpired(entry)) {
      this.entries.delete(ipAddress);
      return null;
    }

    return { ...entry }; // コピーを返す
  }

  /**
   * 指定IPアドレスのエントリが存在するか
   */
  has(ipAddress: string): boolean {
    return this.lookup(ipAddress) !== null;
  }

  // ========================================
  // 更新系
  // ========================================

  /**
   * ARPエントリを更新（または新規作成）
   *
   * ARP Replyを受信したとき、またはARP Requestの送信元情報から学習するときに呼び出す。
   *
   * @param ipAddress IPアドレス
   * @param macAddress MACアドレス
   */
  update(ipAddress: string, macAddress: string): void {
    const now = Date.now();
    const existing = this.entries.get(ipAddress);

    if (existing) {
      // 既存エントリを更新
      existing.macAddress = macAddress;
      existing.state = ArpEntryState.REACHABLE;
      existing.updatedAt = now;
    } else {
      // 新規エントリを作成
      this.ensureCapacity();
      this.entries.set(ipAddress, {
        ipAddress,
        macAddress,
        state: ArpEntryState.REACHABLE,
        createdAt: now,
        updatedAt: now,
      });
    }

    console.log(`[ARP Table] Updated: ${ipAddress} -> ${macAddress}`);
  }

  /**
   * INCOMPLETEエントリを作成
   *
   * ARP Requestを送信した直後に呼び出す。
   * Replyが来る前に同じIPへの重複リクエストを防ぐ。
   *
   * @param ipAddress 解決待ちのIPアドレス
   */
  setIncomplete(ipAddress: string): void {
    const now = Date.now();
    const existing = this.entries.get(ipAddress);

    // 既にREACHABLEなら上書きしない
    if (existing && existing.state === ArpEntryState.REACHABLE) {
      return;
    }

    this.ensureCapacity();
    this.entries.set(ipAddress, {
      ipAddress,
      macAddress: '',
      state: ArpEntryState.INCOMPLETE,
      createdAt: now,
      updatedAt: now,
    });

    console.log(`[ARP Table] Set INCOMPLETE: ${ipAddress}`);
  }

  /**
   * エントリを削除
   *
   * @param ipAddress 削除するIPアドレス
   * @returns 削除に成功したか
   */
  delete(ipAddress: string): boolean {
    const deleted = this.entries.delete(ipAddress);
    if (deleted) {
      console.log(`[ARP Table] Deleted: ${ipAddress}`);
    }
    return deleted;
  }

  /**
   * テーブルをクリア
   */
  clear(): void {
    this.entries.clear();
    console.log('[ARP Table] Cleared');
  }

  // ========================================
  // エージング処理
  // ========================================

  /**
   * 期限切れエントリを削除
   *
   * 定期的に呼び出すことで、古いエントリを自動削除する。
   *
   * @returns 削除されたエントリ数
   */
  purgeExpired(): number {
    let purgedCount = 0;
    for (const [ip, entry] of this.entries) {
      if (this.isExpired(entry)) {
        this.entries.delete(ip);
        purgedCount++;
        console.log(`[ARP Table] Purged expired: ${ip}`);
      }
    }
    return purgedCount;
  }

  /**
   * エントリが期限切れかどうか
   */
  private isExpired(entry: ArpEntry): boolean {
    const now = Date.now();
    const age = now - entry.updatedAt;

    if (entry.state === ArpEntryState.INCOMPLETE) {
      return age > this.config.incompleteTimeout;
    }
    return age > this.config.timeout;
  }

  // ========================================
  // 容量管理
  // ========================================

  /**
   * 容量を確保（最も古いエントリを削除）
   */
  private ensureCapacity(): void {
    if (this.entries.size >= this.config.maxEntries) {
      // 最も古いエントリを探して削除
      let oldestIp: string | null = null;
      let oldestTime = Infinity;

      for (const [ip, entry] of this.entries) {
        if (entry.updatedAt < oldestTime) {
          oldestTime = entry.updatedAt;
          oldestIp = ip;
        }
      }

      if (oldestIp) {
        this.entries.delete(oldestIp);
        console.log(`[ARP Table] Evicted oldest: ${oldestIp}`);
      }
    }
  }

  // ========================================
  // デバッグ・表示
  // ========================================

  /**
   * テーブルの全エントリを取得
   */
  getAllEntries(): ArpEntry[] {
    this.purgeExpired(); // 取得前にクリーンアップ
    return Array.from(this.entries.values()).map((e) => ({ ...e }));
  }

  /**
   * テーブルの内容を文字列で表示
   */
  toString(): string {
    const entries = this.getAllEntries();
    if (entries.length === 0) {
      return 'ARP Table: (empty)';
    }

    const lines = ['ARP Table:', '  IP Address        MAC Address         State       Age(ms)'];
    for (const entry of entries) {
      const age = Date.now() - entry.updatedAt;
      lines.push(
        `  ${entry.ipAddress.padEnd(16)}  ${entry.macAddress.padEnd(18)}  ${entry.state.padEnd(10)}  ${age}`
      );
    }
    return lines.join('\n');
  }

  /**
   * エントリ数を取得
   */
  get size(): number {
    return this.entries.size;
  }
}
