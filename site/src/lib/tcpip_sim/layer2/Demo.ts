
import { NetworkInterface, type INetworkLayer } from './NetworkInterface';
import { LanCable } from '../layer1/LanCable';
import { ETHER_TYPE_IPV4, type L2Payload, type EtherType } from './EthernetFrame';

// ==========================================
// テスト用ユーティリティ
// ==========================================

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

/**
 * モックの上位層クラス
 * 受信したパケットを記録し、検証に使用する
 */
class MockUpperLayer implements INetworkLayer {
  receivedPackets: { payload: L2Payload; type: EtherType; sourceMac?: string }[] = [];
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  receive(payload: L2Payload, type: EtherType, sourceMac?: string): void {
    console.log(`[${this.name}] Received packet from ${sourceMac}:`, payload);
    this.receivedPackets.push({ payload, type, sourceMac });
  }
}

// ==========================================
// デモ1: MACアドレス指定による直接通信
// ==========================================
async function demoMacCommunication() {
  console.log('\n-------------------------------------------');
  console.log(' Demo 1: Direct MAC Communication');
  console.log('-------------------------------------------');

  // 1. セットアップ
  const nic1 = new NetworkInterface('11:11:11:11:11:11', 'port1');
  const nic2 = new NetworkInterface('22:22:22:22:22:22', 'port2');

  // ケーブル接続
  // 参照を保持する必要はないが、GCされないように変数に入れる慣習
  const cable = new LanCable(nic1.port, nic2.port);

  // 上位層（アプリケーション/OS相当）を接続
  const app1 = new MockUpperLayer('App1 (Sender)');
  const app2 = new MockUpperLayer('App2 (Receiver)');

  nic1.upperLayer = app1;
  nic2.upperLayer = app2;

  // 2. アクション: MACアドレス指定でフレーム送信
  const message = "Hello via MAC Address!";
  console.log(`[Demo] Sending message: "${message}" from NIC1 to NIC2`);

  await nic1.sendFrame(nic2.macAddress, ETHER_TYPE_IPV4, message);

  // ケーブルの遅延(デフォルト1ms)などを考慮して少し待つ
  await new Promise(r => setTimeout(r, 100));

  // 3. 検証
  assert(app2.receivedPackets.length === 1, 'Receiver should get exactly 1 packet');
  if (app2.receivedPackets.length > 0) {
    const packet = app2.receivedPackets[0];
    assert(packet.payload === message, `Payload matches: "${packet.payload}"`);
    assert(packet.sourceMac === nic1.macAddress, `Source MAC matches: ${packet.sourceMac}`);
  }
}

// ==========================================
// デモ2: IPアドレス指定による通信 (ARP解決含む)
// ==========================================
async function demoIpCommunication() {
  console.log('\n-------------------------------------------');
  console.log(' Demo 2: IP Communication (with ARP)');
  console.log('-------------------------------------------');

  // 1. セットアップ
  const nic1 = new NetworkInterface('AA:AA:AA:AA:AA:AA', 'portA');
  const nic2 = new NetworkInterface('BB:BB:BB:BB:BB:BB', 'portB');

  // IPアドレス設定
  const ip1 = '192.168.1.10';
  const ip2 = '192.168.1.20';
  nic1.setIpAddress(ip1);
  nic2.setIpAddress(ip2);

  const cable = new LanCable(nic1.port, nic2.port);

  const app1 = new MockUpperLayer('AppA');
  const app2 = new MockUpperLayer('AppB');

  nic1.upperLayer = app1;
  nic2.upperLayer = app2;

  // 2. アクション: IPアドレス指定で送信
  // NIC1はNIC2のMACアドレスを知らないため、ARP Requestをブロードキャストするはず
  const message = "Hello via IP Address!";
  console.log(`[Demo] Sending message: "${message}" from ${ip1} to ${ip2}`);

  // resolveIpToMac -> sendFrame という流れが sendToIp 内部で行われる
  await nic1.sendToIp(ip2, ETHER_TYPE_IPV4, message);

  // ARPの一連の流れ (Req -> Rep -> IP Packet) があるため少し待つ
  await new Promise(r => setTimeout(r, 200));

  // 3. 検証
  // App2はIPパケットのみ受け取る（ARPはNIC内部で処理される）
  assert(app2.receivedPackets.length === 1, 'Receiver should get exactly 1 packet (ARP is hidden)');

  if (app2.receivedPackets.length > 0) {
    const packet = app2.receivedPackets[0];
    assert(packet.payload === message, `Payload matches: "${packet.payload}"`);
    assert(packet.sourceMac === nic1.macAddress, `Source MAC matches: ${packet.sourceMac}`);
  }

  // おまけ: NIC1のARPテーブルが更新されているか確認
  // resolveIpToMacを呼んで、通信が発生せず即座にMACが返ればキャッシュされている証拠
  try {
    const resolvedMac = await nic1.resolveIpToMac(ip2);
    assert(resolvedMac === nic2.macAddress, 'ARP cache is populated correctly');
  } catch (e) {
    assert(false, 'Failed to resolve MAC from cache');
  }
}

// ==========================================
// メイン実行
// ==========================================
async function main() {
  try {
    await demoMacCommunication();
    await demoIpCommunication();
    console.log('\n🎉 All demos completed successfully!');
  } catch (e) {
    console.error('\n💥 Unexpected error during demo execution:', e);
    process.exit(1);
  }
}

main();
