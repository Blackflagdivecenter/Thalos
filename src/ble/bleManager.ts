import { BleManager as RnBleManager } from 'react-native-ble-plx';
import { Platform, PermissionsAndroid } from 'react-native';

let _manager: RnBleManager | null = null;

export function getBleManager(): RnBleManager {
  if (!_manager) _manager = new RnBleManager();
  return _manager;
}

export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    return Object.values(grants).every(g => g === PermissionsAndroid.RESULTS.GRANTED);
  }
  // iOS: permissions declared in Info.plist; system prompts on first scan
  return true;
}

export function destroyBleManager(): void {
  _manager?.destroy();
  _manager = null;
}
