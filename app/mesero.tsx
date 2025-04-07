import React, { useEffect } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useWaiterContext } from '../context/WaiterContext'; // Asegúrate de que la ruta sea correcta

const WaiterScreen: React.FC = () => {
  const { selectTable, selectedTable, tables, loadTables } = useWaiterContext();

  useEffect(() => {
    loadTables(); // Cargar mesas desde Firebase al montar el componente
  }, [loadTables]);

  return (
    <View>
      <Text>Mesas disponibles:</Text>
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ margin: 10 }}>
            <Text>Mesa {item.id}</Text>
            <Text>Status: {item.status}</Text>
            <Button
              title="Seleccionar Mesa"
              disabled={item.status === 'no disponible'}
              onPress={() => selectTable(item.id)}
            />
          </View>
        )}
      />
      {selectedTable && (
        <View style={{ marginTop: 20 }}>
          <Text>Mesa seleccionada: {selectedTable.id}</Text>
          {/* Aquí puedes añadir lógica para continuar con la orden */}
        </View>
      )}
    </View>
  );
};

export default WaiterScreen;
