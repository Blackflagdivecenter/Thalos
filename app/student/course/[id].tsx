import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { ConnectedInstructorService } from '@/src/services/ConnectedInstructorService';
import type {
  PaperworkSubmission,
  PaperworkRequest,
  CloudSkillSignoff,
  CloudCertification,
  ConnectedEnrollment,
} from '@/src/models';

type DocType = 'liability_release' | 'medical_questionnaire' | 'training_acknowledgment';

function DocRow({
  label,
  icon,
  submission,
  requested,
  onComplete,
}: {
  label: string;
  icon: string;
  submission: PaperworkSubmission | undefined;
  requested: boolean;
  onComplete: () => void;
}) {
  const signed = !!submission?.signedAt;
  const reviewed = !!submission?.reviewedAt;

  return (
    <View style={s.docRow}>
      <View style={[s.docIcon, signed ? s.docIconDone : s.docIconPending]}>
        <Ionicons
          name={(signed ? 'checkmark-circle' : icon) as any}
          size={20}
          color={signed ? '#34C759' : Colors.textSecondary}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.docLabel}>{label}</Text>
        <Text style={s.docStatus}>
          {signed && reviewed ? 'Reviewed by instructor' :
           signed ? 'Submitted — awaiting review' :
           requested ? 'Action required' :
           'Not yet requested'}
        </Text>
      </View>
      {!signed && requested ? (
        <Pressable style={s.completeBtn} onPress={onComplete}>
          <Text style={s.completeBtnText}>Complete</Text>
        </Pressable>
      ) : signed ? (
        <Ionicons name="checkmark-circle" size={22} color="#34C759" />
      ) : (
        <Ionicons name="time-outline" size={20} color={Colors.textTertiary} />
      )}
    </View>
  );
}

export default function StudentCourseDetailScreen() {
  const { id, courseId: courseIdParam } = useLocalSearchParams<{ id: string; courseId: string }>();
  const courseId = courseIdParam ?? id;
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [enrollment, setEnrollment] = useState<ConnectedEnrollment | null>(null);
  const [submissions, setSubmissions] = useState<PaperworkSubmission[]>([]);
  const [requests, setRequests] = useState<PaperworkRequest[]>([]);
  const [signoffs, setSignoffs] = useState<CloudSkillSignoff[]>([]);
  const [certs, setCerts] = useState<CloudCertification[]>([]);

  const load = useCallback(async () => {
    if (!courseId) return;
    try {
      const [enrList, subs, reqs, signs, certList] = await Promise.all([
        ConnectedInstructorService.getMyEnrollments(),
        ConnectedInstructorService.getMySubmissions(courseId),
        ConnectedInstructorService.getMyPendingRequests(),
        ConnectedInstructorService.getStudentSignoffs(courseId, '').catch(() => [] as CloudSkillSignoff[]),
        ConnectedInstructorService.getMyCertifications(),
      ]);
      const thisEnr = enrList.find(e => e.courseId === courseId);
      setEnrollment(thisEnr ?? null);
      setSubmissions(subs);
      setRequests(reqs.filter(r => r.courseId === courseId));
      // For signoffs, we need to get them for the current student - use enrollment info
      if (thisEnr) {
        try {
          const mySignoffs = await ConnectedInstructorService.getStudentSignoffs(courseId, thisEnr.studentId);
          setSignoffs(mySignoffs);
        } catch { /* silent */ }
      }
      setCerts(certList.filter(c => c.courseId === courseId));
    } catch (e) {
      console.warn('[StudentCourseDetail] load error:', e);
    }
    setLoading(false);
  }, [courseId]);

  useEffect(() => { load(); }, [load]);

  const getSub = (dt: DocType) => submissions.find(s => s.docType === dt);
  const isRequested = (dt: DocType) => requests.some(r => r.requestType === dt);

  const handleCompletePaperwork = (docType: DocType) => {
    const formMap: Record<DocType, string> = {
      liability_release: '/instructor/forms/liability',
      medical_questionnaire: '/instructor/forms/medical',
      training_acknowledgment: '/instructor/forms/liability', // reuse liability form for ack
    };
    router.push(`${formMap[docType]}?mode=connected&courseId=${courseId}&docType=${docType}` as any);
  };

  if (loading) {
    return (
      <View style={[s.root, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.accentBlue} style={{ marginTop: 80 }} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{enrollment?.courseName ?? 'Course'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} tintColor={Colors.accentBlue} />}
      >
        {/* Course Info */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="school" size={22} color={Colors.accentBlue} />
            <Text style={s.cardTitle}>Course Info</Text>
          </View>
          <View style={s.infoGrid}>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Level</Text>
              <Text style={s.infoValue}>{enrollment?.courseLevel ?? '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Instructor</Text>
              <Text style={s.infoValue}>{enrollment?.instructorName ?? '—'}</Text>
            </View>
            <View style={s.infoItem}>
              <Text style={s.infoLabel}>Status</Text>
              <Text style={[s.infoValue, { color: '#34C759' }]}>{enrollment?.status ?? '—'}</Text>
            </View>
          </View>
        </View>

        {/* Certification Card */}
        {certs.length > 0 && (
          <View style={[s.card, s.certCard]}>
            <Ionicons name="ribbon" size={28} color="#FFD700" />
            <Text style={s.certTitle}>Certified!</Text>
            <Text style={s.certLevel}>{certs[0].certLevel}</Text>
            {certs[0].certAgency ? <Text style={s.certAgency}>{certs[0].certAgency}</Text> : null}
            <Text style={s.certDate}>Issued {certs[0].issuedDate}</Text>
          </View>
        )}

        {/* Paperwork */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="document-text" size={22} color={Colors.accentBlue} />
            <Text style={s.cardTitle}>Paperwork</Text>
          </View>
          <DocRow
            label="Liability Release"
            icon="shield-outline"
            submission={getSub('liability_release')}
            requested={isRequested('liability_release')}
            onComplete={() => handleCompletePaperwork('liability_release')}
          />
          <DocRow
            label="Medical Questionnaire"
            icon="medkit-outline"
            submission={getSub('medical_questionnaire')}
            requested={isRequested('medical_questionnaire')}
            onComplete={() => handleCompletePaperwork('medical_questionnaire')}
          />
          <DocRow
            label="Training Acknowledgment"
            icon="create-outline"
            submission={getSub('training_acknowledgment')}
            requested={isRequested('training_acknowledgment')}
            onComplete={() => handleCompletePaperwork('training_acknowledgment')}
          />
        </View>

        {/* Skills Progress */}
        <View style={s.card}>
          <View style={s.cardHeader}>
            <Ionicons name="checkmark-done" size={22} color={Colors.accentBlue} />
            <Text style={s.cardTitle}>Skills Progress</Text>
          </View>
          {signoffs.length > 0 ? (
            <>
              <Text style={s.skillCount}>{signoffs.length} skills signed off</Text>
              {signoffs.map(so => (
                <View key={so.id} style={s.skillRow}>
                  <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                  <Text style={s.skillName}>{so.skillName}</Text>
                  <Text style={s.skillEnv}>{so.environment.replace('_', ' ')}</Text>
                </View>
              ))}
            </>
          ) : (
            <Text style={s.noSkills}>No skills signed off yet. Your instructor will sign off skills during training.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
  },
  headerTitle: { ...Typography.headline, fontWeight: '700', color: Colors.text, flex: 1, textAlign: 'center' },
  content: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.xl },

  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.lg, padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, marginBottom: Spacing.xs },
  cardTitle: { ...Typography.subhead, fontWeight: '700', color: Colors.text },

  infoGrid: { flexDirection: 'row', gap: Spacing.md },
  infoItem: { flex: 1 },
  infoLabel: { ...Typography.caption1, color: Colors.textTertiary },
  infoValue: { ...Typography.subhead, fontWeight: '600', color: Colors.text, marginTop: 2 },

  certCard: {
    alignItems: 'center', gap: Spacing.xs,
    backgroundColor: '#34C759' + '10', borderWidth: 1, borderColor: '#34C759' + '30',
  },
  certTitle: { ...Typography.title2, fontWeight: '800', color: '#34C759' },
  certLevel: { ...Typography.headline, fontWeight: '700', color: Colors.text },
  certAgency: { ...Typography.subhead, color: Colors.textSecondary },
  certDate: { ...Typography.caption1, color: Colors.textTertiary },

  docRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  docIcon: {
    width: 32, height: 32, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  docIconDone: { backgroundColor: '#34C759' + '15' },
  docIconPending: { backgroundColor: Colors.border + '40' },
  docLabel: { ...Typography.subhead, fontWeight: '600', color: Colors.text },
  docStatus: { ...Typography.caption1, color: Colors.textTertiary },
  completeBtn: {
    backgroundColor: Colors.accentBlue, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  completeBtnText: { ...Typography.caption1, fontWeight: '700', color: '#fff' },

  skillCount: { ...Typography.footnote, fontWeight: '600', color: Colors.accentBlue },
  skillRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs, paddingVertical: 3 },
  skillName: { ...Typography.subhead, color: Colors.text, flex: 1 },
  skillEnv: { ...Typography.caption2, color: Colors.textTertiary, textTransform: 'capitalize' },
  noSkills: { ...Typography.footnote, color: Colors.textTertiary },
});
