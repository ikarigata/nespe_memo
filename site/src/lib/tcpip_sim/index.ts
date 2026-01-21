/**
 * TCP/IP シミュレータ
 *
 * ネットワークプロトコルの動作をシミュレートするTypeScriptライブラリ。
 *
 * @example
 * import {
 *   // Layer 1
 *   Signal, Port, LanCable, RepeaterHub,
 *   // Layer 2
 *   NetworkInterface, L2Switch, ArpHandler,
 *   // Utils
 *   generateMacAddress, isValidIpAddress,
 * } from './lib/tcpip_sim';
 */

// ========================================
// Layer 1 (物理層)
// ========================================
export {
  Signal,
  Port,
  LanCable,
  RepeaterHub,
} from './layer1';

// ========================================
// Layer 2 (データリンク層)
// ========================================
export {
  // Ethernet
  type EthernetFrame,
  type MacAddress,
  type EtherType,
  type L2Payload,
  ETHER_TYPE_IPV4,
  ETHER_TYPE_ARP,
  ETHER_TYPE_IPV6,
  ETHER_TYPE_VLAN,
  MAC_BROADCAST,
  MAC_UNKNOWN,
  etherTypeToString,
  isBroadcastMac,
  isValidMacAddress,
  // ARP
  type ArpPacket,
  ArpOperation,
  createArpRequest,
  createArpReply,
  isArpPacket,
  formatArpPacket,
  // ARP Table
  type ArpEntry,
  type ArpTableConfig,
  ArpTable,
  ArpEntryState,
  // ARP Handler
  type ArpHandlerConfig,
  ArpHandler,
  // Network Interface
  type INetworkLayer,
  NetworkInterface,
  // L2 Switch
  L2Switch,
} from './layer2';

// ========================================
// Utilities
// ========================================
export {
  simulateCableDelay,
  generateMacAddress,
  isValidIpAddress,
  ipToNumber,
  numberToIp,
  isSameNetwork,
} from './Utils';
