/**
 * Create / edit a course.
 * Route params: ?id=<courseId>  → edit mode
 */
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TextStyle,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/src/ui/theme';
import { useInstructorStore } from '@/src/stores/instructorStore';
import { COURSE_TEMPLATES, LEVEL_LABELS, LEVEL_COLORS } from '@/src/instructor/courseTemplates';
import { todayISO } from '@/src/utils/uuid';

const STATUSES = ['planning', 'active', 'completed', 'cancelled'] as const;
type CourseStatus = typeof STATUSES[number];

function SectionTitle({ label }: { label: string }) {
  return <Text style={st.title}>{label}</Text>;
}
const st = StyleSheet.create({
  title: {
    ...(Typography.footnote as TextStyle),
    fontWeight: '700' as TextStyle['fontWeight'],
    color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5,
    marginTop: Spacing.lg, marginBottom: Spacing.xs,
  },
});

function Field({
  label, value, onChangeText, placeholder, keyboard = 'default', multiline = false,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder?: string;
  keyboard?: 'default' | 'email-address' | 'phone-pad' | 'number-pad' | 'numeric';
  multiline?: boolean;
}) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={[f.input, multiline && f.multiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textTertiary}
        keyboardType={keyboard}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}
const f = StyleSheet.create({
  wrap:  { gap: 4, paddingVertical: Spacing.xs },
  label: { ...(Typography.footnote as TextStyle), color: Colors.textSecondary, fontWeight: '600' as TextStyle['fontWeight'] },
  input: {
    ...(Typography.body as TextStyle), color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  multiline: { minHeight: 60 },
});

export default function AddEditCourseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { createCourse, updateCourse, getCourse } = useInstructorStore();

  const existing = id ? getCourse(id) : undefined;
  const isEdit = !!existing;

  // Template picker state
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [templateId, setTemplateId] = useState(existing?.templateId ?? '');

  const selectedTemplate = COURSE_TEMPLATES.find(t => t.id === templateId);

  // Fields
  const [name, setName]           = useState(existing?.name ?? '');
  const [status, setStatus]       = useState<CourseStatus>((existing?.status as CourseStatus) ?? 'planning');
  const [location, setLocation]   = useState(existing?.location ?? '');
  const [maxStudents, setMaxStudents] = useState(
    existing?.maxStudents != null ? String(existing.maxStudents) : '8',
  );
  const [notes, setNotes]         = useState(existing?.description ?? '');

  // Schedule
  const [hasStartDate, setHasStartDate] = useState(!!existing?.startDate);
  const [startDate, setStartDate]       = useState(existing?.startDate ?? todayISO());
  const [hasEndDate, setHasEndDate]     = useState(!!existing?.endDate);
  const [endDate, setEndDate]           = useState(existing?.endDate ?? todayISO());

  function pickTemplate(tid: string) {
    const t = COURSE_TEMPLATES.find(tt => tt.id === tid);
    setTemplateId(tid);
    if (t && !name) setName(t.name);
    setTemplatePickerOpen(false);
  }

  function adjustMax(delta: number) {
    const cur = parseInt(maxStudents, 10) || 8;
    const next = Math.min(30, Math.max(1, cur + delta));
    setMaxStudents(String(next));
  }

  function handleSave() {
    if (!name.trim()) return;
    const input = {
      name:        name.trim(),
      level:       selectedTemplate?.level ?? 'intermediate',
      templateId:  templateId || null,
      status,
      location:    location.trim() || null,
      startDate:   hasStartDate ? startDate : null,
      endDate:     hasEndDate   ? endDate   : null,
      maxStudents: parseInt(maxStudents, 10) || 8,
      description: notes.trim() || null,
    };
    if (isEdit) {
      updateCourse(id!, input);
    } else {
      createCourse(input);
    }
    router.back();
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Navbar */}
      <View style={s.navbar}>
        <Pressable style={s.cancelBtn} onPress={() => router.back()}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={s.navTitle}>{isEdit ? 'Edit Course' : 'New Course'}</Text>
        <Pressable style={s.saveBtn} onPress={handleSave}>
          <Text style={s.saveText}>Save</Text>
        </Pressable>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + Spacing.xl }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Template Picker */}
        <SectionTitle label="Template" />
        <View style={s.card}>
          <Pressable style={s.templateRow} onPress={() => setTemplatePickerOpen(v => !v)}>
            <View style={s.templateMain}>
              <Text style={s.templateValue} numberOfLines={1}>
                {selectedTemplate ? selectedTemplate.name : 'Select a template (optional)'}
              </Text>
              {selectedTemplate ? (
                <Text style={s.templateSub}>{selectedTemplate.description}</Text>
              ) : null}
            </View>
            <Ionicons
              name={templatePickerOpen ? 'chevron-up' : 'chevron-down'}
              size={18} color={Colors.textTertiary}
            />
          </Pressable>

          {templatePickerOpen && (
            <View>
              <View style={s.divider} />
              {COURSE_TEMPLATES.map(t => {
                const levelColor = LEVEL_COLORS[t.level];
                return (
                  <Pressable key={t.id} style={s.tplOption} onPress={() => pickTemplate(t.id)}>
                    <View style={s.tplOptionContent}>
                      <View style={[s.levelDot, { backgroundColor: levelColor }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={s.tplName}>{t.name}</Text>
                        <Text style={s.tplLevel}>{LEVEL_LABELS[t.level]}</Text>
                      </View>
                    </View>
                    {templateId === t.id && (
                      <Ionicons name="checkmark" size={18} color={Colors.accentBlue} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Course Details */}
        <SectionTitle label="Course Details" />
        <View style={s.card}>
          <Field label="Course Name *" value={name} onChangeText={setName} placeholder="Required" />
          <View style={s.divider} />

          {/* Status picker */}
          <View style={s.statusSection}>
            <Text style={f.label}>Status</Text>
            <View style={s.statusPills}>
              {STATUSES.map(st => (
                <Pressable
                  key={st}
                  style={[
                    s.statusPill,
                    status === st && { backgroundColor: Colors.accentBlue, borderColor: Colors.accentBlue },
                  ]}
                  onPress={() => setStatus(st)}
                >
                  <Text style={[
                    s.statusPillText,
                    status === st && { color: '#FFFFFF' },
                  ]}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Schedule */}
        <SectionTitle label="Schedule" />
        <View style={s.card}>
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>Start Date</Text>
            <Switch value={hasStartDate} onValueChange={setHasStartDate} trackColor={{ true: Colors.accentBlue }} />
          </View>
          {hasStartDate && (
            <TextInput
              style={[f.input, { marginTop: Spacing.xs }]}
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
            />
          )}
          <View style={s.divider} />
          <View style={s.toggleRow}>
            <Text style={s.toggleLabel}>End Date</Text>
            <Switch value={hasEndDate} onValueChange={setHasEndDate} trackColor={{ true: Colors.accentBlue }} />
          </View>
          {hasEndDate && (
            <TextInput
              style={[f.input, { marginTop: Spacing.xs }]}
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="numeric"
            />
          )}
        </View>

        {/* Details */}
        <SectionTitle label="Details" />
        <View style={s.card}>
          <Field label="Location" value={location} onChangeText={setLocation} placeholder="Optional" />
          <View style={s.divider} />
          <View style={s.stepperRow}>
            <Text style={s.toggleLabel}>Max Students</Text>
            <View style={s.stepper}>
              <Pressable style={s.stepBtn} onPress={() => adjustMax(-1)}>
                <Ionicons name="remove" size={18} color={Colors.accentBlue} />
              </Pressable>
              <Text style={s.stepValue}>{maxStudents}</Text>
              <Pressable style={s.stepBtn} onPress={() => adjustMax(1)}>
                <Ionicons name="add" size={18} color={Colors.accentBlue} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Notes */}
        <SectionTitle label="Notes" />
        <View style={s.card}>
          <Field label="Internal Notes" value={notes} onChangeText={setNotes} placeholder="Optional" multiline />
        </View>

        {/* Skills Preview (new course only) */}
        {!isEdit && selectedTemplate && (() => {
          const allTplSkills = [
            ...(selectedTemplate.knowledgeSkills ?? []),
            ...(selectedTemplate.confinedSkills   ?? []),
            ...(selectedTemplate.openWaterSkills  ?? []),
          ];
          return allTplSkills.length > 0 ? (
            <>
              <SectionTitle label="Skills Preview" />
              <View style={s.card}>
                <Text style={s.skillsNote}>
                  {allTplSkills.length} skills from template:
                </Text>
                {allTplSkills.map((skill, i) => (
                  <View key={i} style={s.skillRow}>
                    <View style={s.skillDot} />
                    <Text style={s.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          ) : null;
        })()}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  navbar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  cancelBtn:  { paddingVertical: Spacing.xs, paddingRight: Spacing.sm, minWidth: 60 },
  cancelText: { ...(Typography.body as TextStyle), color: Colors.accentBlue },
  navTitle:   { flex: 1, ...(Typography.headline as TextStyle), color: Colors.text, textAlign: 'center' },
  saveBtn:    { paddingVertical: Spacing.xs, paddingLeft: Spacing.sm, minWidth: 60, alignItems: 'flex-end' },
  saveText:   { ...(Typography.body as TextStyle), color: Colors.accentBlue, fontWeight: '600' as TextStyle['fontWeight'] },
  scroll:     { flex: 1 },
  content:    { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
  },
  divider:   { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.xs },
  toggleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  toggleLabel: { flex: 1, ...(Typography.body as TextStyle), color: Colors.text },

  templateRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  templateMain: { flex: 1 },
  templateValue: { ...(Typography.body as TextStyle), color: Colors.text },
  templateSub:   { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, marginTop: 2 },

  tplOption: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: Spacing.sm, gap: Spacing.sm,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  tplOptionContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  levelDot: { width: 8, height: 8, borderRadius: 4 },
  tplName:  { ...(Typography.subhead as TextStyle), color: Colors.text },
  tplLevel: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary },

  statusSection: { paddingVertical: Spacing.sm, gap: Spacing.xs },
  statusPills: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  statusPill: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  statusPillText: { ...(Typography.caption1 as TextStyle), color: Colors.text },

  stepperRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.sm },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  stepBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  stepValue: { ...(Typography.body as TextStyle), color: Colors.text, minWidth: 28, textAlign: 'center', fontVariant: ['tabular-nums'] },

  skillsNote: { ...(Typography.caption1 as TextStyle), color: Colors.textSecondary, paddingVertical: Spacing.xs },
  skillRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, paddingVertical: 3 },
  skillDot:   { width: 5, height: 5, borderRadius: 2.5, backgroundColor: Colors.textTertiary, marginTop: 7 },
  skillText:  { flex: 1, ...(Typography.caption1 as TextStyle), color: Colors.text },
});
