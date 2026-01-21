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
// Layer 3 (ネットワーク層)
// ========================================
export {
  // IP Address
  type IpAddressString,
  type SubnetMaskString,
  type CidrNotation,
  type SubnetInfo,
  DEFAULT_SUBNET_MASK,
  IP_BROADCAST,
  IP_LOOPBACK,
  prefixToSubnetMask,
  subnetMaskToPrefix,
  getNetworkAddress,
  getBroadcastAddress,
  getSubnetInfo,
  parseCidr,
  getSubnetInfoFromCidr,
  isInSubnet,
  // IP Packet
  type IpHeader,
  type IpPacket,
  type L3Payload,
  IpProtocol,
  DEFAULT_TTL,
  ipProtocolToString,
  createIpPacket,
  isIpPacket,
  formatIpPacket,
  decrementTtl,
  // Routing Table
  type RouteType,
  type RoutingEntry,
  type RouteResult,
  DEFAULT_ROUTE_DESTINATION,
  DEFAULT_ROUTE_MASK,
  RoutingTable,
  // IP Stack
  type ITransportLayer,
  type InterfaceConfig,
  IpStack,
} from './layer3';

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
