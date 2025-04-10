{/* Tasks Section */}
<View style={styles.section}>
  <Text style={styles.sectionTitle}>Tasks & Activities</Text>
  <View style={styles.table}>
    <View style={styles.tableRow}>
      <Text style={[styles.tableHeader, { flex: 3 }]}>Description</Text>
      <Text style={[styles.tableHeader, { flex: 1 }]}>Quantity</Text>
      <Text style={[styles.tableHeader, { flex: 1 }]}>Unit</Text>
      <Text style={[styles.tableHeader, { flex: 1 }]}>Hours</Text>
      <Text style={[styles.tableHeader, { flex: 2 }]}>Equipment</Text>
    </View>
    {Array.isArray(entry.tasks) && entry.tasks.length > 0 ? (
      entry.tasks.map((task, index) => (
        <View key={index} style={styles.tableRow}>
          <Text style={[styles.tableCell, { flex: 3 }]}>{task.description || '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{task.quantity || '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{task.unit || '-'}</Text>
          <Text style={[styles.tableCell, { flex: 1 }]}>{task.hours || '-'}</Text>
          <Text style={[styles.tableCell, { flex: 2 }]}>
            {Array.isArray(task.equipment) ? task.equipment.join(', ') : '-'}
          </Text>
        </View>
      ))
    ) : (
      <View style={styles.tableRow}>
        <Text style={[styles.tableCell, { flex: 8, textAlign: 'center' }]}>No tasks recorded</Text>
      </View>
    )}
  </View>
</View> 