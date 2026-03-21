import { getDb } from '@/src/db/client';
import { DiveRepository } from '@/src/repositories/DiveRepository';
import { AuditService } from './AuditService';
import {
  Dive,
  DiveWithVersion,
  DiveStats,
  CreateDiveInput,
  EditDiveInput,
  DiveType,
} from '@/src/models';
import { generateId, nowISO } from '@/src/utils/uuid';

const diveRepo = new DiveRepository();
const audit = new AuditService();

export class DiveService {
  getAllDives(): DiveWithVersion[] {
    return diveRepo.getAllWithVersion();
  }

  getDive(id: string): DiveWithVersion | null {
    return diveRepo.getByIdWithVersion(id);
  }

  getStats(): DiveStats {
    return diveRepo.getStats();
  }

  createDive(input: CreateDiveInput): DiveWithVersion {
    const db = getDb();
    const now = nowISO();
    const diveId = generateId();
    const versionId = generateId();
    const diveNumber = diveRepo.getNextDiveNumber();

    db.withTransactionSync(() => {
      diveRepo.insertDive({
        id: diveId,
        diveNumber,
        diveType: input.diveType,
        currentVersionId: versionId,
        tripId: input.tripId,
        createdAt: now,
      });
      diveRepo.insertVersion({
        id: versionId,
        diveId,
        versionNumber: 1,
        createdAt: now,
        date: input.date,
        siteId: input.siteId,
        siteName: input.siteName,
        maxDepthMeters: input.maxDepthMeters,
        bottomTimeMinutes: input.bottomTimeMinutes,
        surfaceIntervalMinutes: input.surfaceIntervalMinutes,
        waterTemperatureCelsius: input.waterTemperatureCelsius,
        visibility: input.visibility,
        conditions: input.conditions,
        equipment: input.equipment,
        notes: input.notes,
        startPressureBar: input.startPressureBar,
        endPressureBar: input.endPressureBar,
        gasType: input.gasType,
        tankSizeLiters: input.tankSizeLiters,
        courseName: input.courseName,
        skillsCompleted: input.skillsCompleted,
        cylindersJson: input.cylindersJson,
        activityTagsJson: input.activityTagsJson,
        visibilityRating: input.visibilityRating,
        currentRating: input.currentRating,
        waveRating: input.waveRating,
      });
    });

    audit.log('DIVE_CREATED', diveId, 'dive', { diveNumber, diveType: input.diveType });

    return diveRepo.getByIdWithVersion(diveId)!;
  }

  editDive(id: string, input: EditDiveInput): DiveWithVersion {
    const db = getDb();
    const now = nowISO();

    const existing = diveRepo.getByIdWithVersion(id);
    if (!existing) throw new Error(`Dive ${id} not found`);
    if (existing.isSignedByInstructor && existing.diveType === 'TRAINING') {
      throw new Error('Cannot edit a signed training dive');
    }

    const history = diveRepo.getVersionHistory(id);
    const newVersionNumber = history.length + 1;
    const newVersionId = generateId();

    db.withTransactionSync(() => {
      diveRepo.insertVersion({
        id: newVersionId,
        diveId: id,
        versionNumber: newVersionNumber,
        createdAt: now,
        date: input.date ?? existing.date,
        siteId: input.siteId ?? existing.siteId,
        siteName: input.siteName ?? existing.siteName,
        maxDepthMeters: input.maxDepthMeters ?? existing.maxDepthMeters,
        bottomTimeMinutes: input.bottomTimeMinutes ?? existing.bottomTimeMinutes,
        surfaceIntervalMinutes: input.surfaceIntervalMinutes ?? existing.surfaceIntervalMinutes,
        waterTemperatureCelsius: input.waterTemperatureCelsius ?? existing.waterTemperatureCelsius,
        visibility: input.visibility ?? existing.visibility,
        conditions: input.conditions ?? existing.conditions,
        equipment: input.equipment ?? existing.equipment,
        notes: input.notes ?? existing.notes,
        startPressureBar: input.startPressureBar ?? existing.startPressureBar,
        endPressureBar: input.endPressureBar ?? existing.endPressureBar,
        gasType: input.gasType ?? existing.gasType,
        tankSizeLiters: input.tankSizeLiters ?? existing.tankSizeLiters,
        courseName: input.courseName ?? existing.courseName,
        skillsCompleted: input.skillsCompleted ?? existing.skillsCompleted,
        changeDescription: input.changeDescription,
        cylindersJson: input.cylindersJson ?? existing.cylindersJson,
        activityTagsJson: input.activityTagsJson ?? existing.activityTagsJson,
        visibilityRating: input.visibilityRating ?? existing.visibilityRating,
        currentRating: input.currentRating ?? existing.currentRating,
        waveRating: input.waveRating ?? existing.waveRating,
      });
      diveRepo.updateCurrentVersion(id, newVersionId, now);
      if (input.tripId !== undefined) {
        diveRepo.updateTripId(id, input.tripId, now);
      }
    });

    audit.log('DIVE_EDITED', id, 'dive', { versionNumber: newVersionNumber });

    return diveRepo.getByIdWithVersion(id)!;
  }

  softDeleteDive(id: string): void {
    const now = nowISO();
    diveRepo.softDelete(id, now);
    audit.log('DIVE_DELETED', id, 'dive');
  }
}
