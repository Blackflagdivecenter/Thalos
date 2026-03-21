import { getDb } from '@/src/db/client';
import { EAP } from '@/src/models';

interface EAPRow {
  id: string;
  site_id: string;
  nearest_hospital_name: string | null;
  nearest_hospital_address: string | null;
  nearest_hospital_phone: string | null;
  nearest_chamber_name: string | null;
  nearest_chamber_address: string | null;
  nearest_chamber_phone: string | null;
  coast_guard_phone: string | null;
  local_emergency_number: string | null;
  dan_emergency_number: string;
  oxygen_location: string | null;
  first_aid_kit_location: string | null;
  aed_location: string | null;
  evacuation_procedure: string | null;
  nearest_exit_point: string | null;
  vhf_channel: string | null;
  additional_notes: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(r: EAPRow): EAP {
  return {
    id: r.id,
    siteId: r.site_id,
    nearestHospitalName: r.nearest_hospital_name,
    nearestHospitalAddress: r.nearest_hospital_address,
    nearestHospitalPhone: r.nearest_hospital_phone,
    nearestChamberName: r.nearest_chamber_name,
    nearestChamberAddress: r.nearest_chamber_address,
    nearestChamberPhone: r.nearest_chamber_phone,
    coastGuardPhone: r.coast_guard_phone,
    localEmergencyNumber: r.local_emergency_number,
    danEmergencyNumber: r.dan_emergency_number,
    oxygenLocation: r.oxygen_location,
    firstAidKitLocation: r.first_aid_kit_location,
    aedLocation: r.aed_location,
    evacuationProcedure: r.evacuation_procedure,
    nearestExitPoint: r.nearest_exit_point,
    vhfChannel: r.vhf_channel,
    additionalNotes: r.additional_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export class EAPRepository {
  getBySiteId(siteId: string): EAP | null {
    const db = getDb();
    const row = db.getFirstSync<EAPRow>(
      'SELECT * FROM emergency_action_plans WHERE site_id = ?',
      [siteId]
    );
    return row ? mapRow(row) : null;
  }

  insert(params: { id: string; siteId: string; createdAt: string }): void {
    const db = getDb();
    db.runSync(
      `INSERT INTO emergency_action_plans (id, site_id, dan_emergency_number, created_at, updated_at)
       VALUES (?, ?, '+1-919-684-9111', ?, ?)`,
      [params.id, params.siteId, params.createdAt, params.createdAt]
    );
  }

  deleteBySiteId(siteId: string): void {
    const db = getDb();
    db.runSync('DELETE FROM emergency_action_plans WHERE site_id = ?', [siteId]);
  }

  update(siteId: string, fields: Partial<Omit<EAP, 'id' | 'siteId' | 'createdAt'>>, updatedAt: string): void {
    const db = getDb();
    const eap = this.getBySiteId(siteId);
    if (!eap) return;
    db.runSync(
      `UPDATE emergency_action_plans SET
         nearest_hospital_name = ?,
         nearest_hospital_address = ?,
         nearest_hospital_phone = ?,
         nearest_chamber_name = ?,
         nearest_chamber_address = ?,
         nearest_chamber_phone = ?,
         coast_guard_phone = ?,
         local_emergency_number = ?,
         dan_emergency_number = ?,
         oxygen_location = ?,
         first_aid_kit_location = ?,
         aed_location = ?,
         evacuation_procedure = ?,
         nearest_exit_point = ?,
         vhf_channel = ?,
         additional_notes = ?,
         updated_at = ?
       WHERE site_id = ?`,
      [
        fields.nearestHospitalName ?? eap.nearestHospitalName,
        fields.nearestHospitalAddress ?? eap.nearestHospitalAddress,
        fields.nearestHospitalPhone ?? eap.nearestHospitalPhone,
        fields.nearestChamberName ?? eap.nearestChamberName,
        fields.nearestChamberAddress ?? eap.nearestChamberAddress,
        fields.nearestChamberPhone ?? eap.nearestChamberPhone,
        fields.coastGuardPhone ?? eap.coastGuardPhone,
        fields.localEmergencyNumber ?? eap.localEmergencyNumber,
        fields.danEmergencyNumber ?? eap.danEmergencyNumber,
        fields.oxygenLocation ?? eap.oxygenLocation,
        fields.firstAidKitLocation ?? eap.firstAidKitLocation,
        fields.aedLocation ?? eap.aedLocation,
        fields.evacuationProcedure ?? eap.evacuationProcedure,
        fields.nearestExitPoint ?? eap.nearestExitPoint,
        fields.vhfChannel ?? eap.vhfChannel,
        fields.additionalNotes ?? eap.additionalNotes,
        updatedAt,
        siteId,
      ]
    );
  }
}
