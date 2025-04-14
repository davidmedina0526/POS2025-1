import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  FlatList, 
  TextInput, 
  Alert,
  Image,
  Button
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';
import { useMenu } from '../context/MenuContext';
import { useWaiterContext } from '../context/WaiterContext';
import { OrderItem } from '../interfaces/OrderItem';
import { MenuItem } from '@/interfaces/MenuItem';
import { Table } from '@/interfaces/Table';

// Importación de expo-camera según SDK 52
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';

export default function WaiterScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    tables,
    selectTable,
    selectedTable,
    createOrder,
    loadTables,
    addOrderItem,
    freeTable, // Función para liberar la mesa
    showPopup,
    orderForPopup,
    setShowPopup,
  } = useWaiterContext();

  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [quantity, setQuantity] = useState<string>('1');
  const [selectedCategory, setSelectedCategory] = useState<
    'entrada' | 'plato principal' | 'postre' | 'bebida' | null
  >(null);

  const { menuItems, getMenuItems } = useMenu();

  // Se reemplaza la solicitud de permiso utilizando expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');

  useEffect(() => {
    setMounted(true);
    loadTables();
    getMenuItems();
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'mesero')) {
      router.replace('./index');
    }
  }, [user, mounted]);

  // Maneja el escaneo del QR usando expo-camera
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setShowQRScanner(false);
    // Se espera que el QR contenga un identificador de mesa con el formato "table_X"
    if (data.startsWith('table')) {
      const tableId = data; // 'table_X'
      selectTable(tableId);  // Selecciona la mesa al escanear
      setShowMenuModal(true);
      setSelectedCategory(null); // Resetea la categoría seleccionada
    } else {
      Alert.alert('QR inválido', 'El código QR escaneado no es válido para una mesa.');
    }
  };

  // Modifica el renderizado para abrir el escáner QR
  const handleOpenQRScanner = () => {
    setShowQRScanner(true); // Muestra el modal del escáner QR
  };

  const handleSelectTable = (table: Table) => {
    if (table.status === 'disponible') {
      selectTable(table.id);
      setShowMenuModal(true);
      setSelectedCategory(null);
    } else {
      Alert.alert('Mesa ocupada', 'Esta mesa ya tiene una orden asignada.');
      const currentOrderItems = tables.find(item => item.id === table.id)?.orderItems;
      if (currentOrderItems) {
        setOrderItems(currentOrderItems);
      }
    }
  };

  // Manejador para liberar la mesa y borrar la orden asociada
  const handleFreeTable = async (tableId: string) => {
    try {
      await freeTable(tableId);
      Alert.alert('Mesa liberada', 'La mesa se ha liberado y la orden se ha borrado.');
    } catch (error) {
      console.error('Error al liberar la mesa:', error);
      Alert.alert('Error', 'No se pudo liberar la mesa.');
    }
  };

  const handleSelectMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setQuantity('1');
  };

  const addItemToOrder = () => {
    if (!selectedMenuItem) return;

    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Cantidad inválida', 'Ingresa una cantidad mayor a 0');
      return;
    }

    const index = orderItems.findIndex(item => item.menuItemId === selectedMenuItem.id);
    if (index > -1) {
      const updatedItems = [...orderItems];
      updatedItems[index].quantity += parsedQuantity;
      setOrderItems(updatedItems);
      addOrderItem(selectedTable?.id || '', updatedItems[index]);
    } else {
      const newItem: OrderItem = {
        menuItemId: selectedMenuItem.id,
        name: selectedMenuItem.name,
        quantity: parsedQuantity,
        price: selectedMenuItem.price,
      };
      setOrderItems(prev => [...prev, newItem]);
      addOrderItem(selectedTable?.id || '', newItem);
    }
    setSelectedMenuItem(null);
    setQuantity('1');
  };

  const sendOrder = async () => {
    if (!selectedTable) return;
    await createOrder(selectedTable.id, orderItems);
    Alert.alert('Orden enviada', 'La orden se ha enviado a la cocina');
    setOrderItems([]);
    setShowOrderModal(false);
    selectTable('');
  };

  const filteredMenuItems = selectedCategory
    ? menuItems.filter(item => item.category === selectedCategory)
    : [];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, waiter!</Text>

      {/* Botón para activar el escáner QR */}
      <TouchableOpacity style={styles.qrButton} onPress={() => setShowQRScanner(true)}>
        <Text style={styles.qrButtonText}>Scan QR Code</Text>
      </TouchableOpacity>

      {/* Lista de mesas */}
      <FlatList
        data={tables}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.table} onPress={() => handleSelectTable(item)}>
            <Text style={styles.tableText}>Table {item.id}</Text>
            <Text style={styles.tableText}>
              {item.status === 'disponible' ? 'Available' : 'Occupied'}
            </Text>
            {/* Botón para liberar la mesa */}
            <TouchableOpacity style={styles.freeButton} onPress={() => handleFreeTable(item.id)}>
              <Image 
                source={require('../assets/images/door.png')}
                style={{ width: 25, height: 25 }}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.orderButton} onPress={() => setShowOrderModal(true)}>
        <Text style={styles.orderButtonText}>View Order</Text>
      </TouchableOpacity>

      {/* Popup de la orden lista */}
      <Modal visible={showPopup} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>¡Pedido Listo!</Text>
          {orderForPopup && (
            <>
              <Text>Orden ID: {orderForPopup.id}</Text>
              <Text>Total: ${orderForPopup.total}</Text>
            </>
          )}
          <Button title="Cerrar" onPress={() => setShowPopup(false)} />
        </View>
      </Modal>

      <TouchableOpacity style={styles.qrButton} onPress={handleOpenQRScanner}>
        <Text style={styles.qrButtonText}>Scan QR Code</Text>
      </TouchableOpacity>

      {/* Modal para escanear QR utilizando expo-camera */}
      <Modal visible={showQRScanner} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Scan QR Code</Text>
          {(!permission || !permission.granted) ? (
            <View style={styles.permissionContainer}>
              <Text style={styles.modalText}>Solicitando permiso para la cámara...</Text>
              <Button onPress={requestPermission} title="Grant permission" />
            </View>
          ) : (
            <CameraView 
              style={styles.camera}
              facing={cameraFacing}
              onBarcodeScanned={handleBarCodeScanned}
            />
          )}
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowQRScanner(false)}>
            <Text style={styles.closeModalText}>Close Scanner</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para seleccionar platos del menú */}
      <Modal visible={showMenuModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Menu</Text>
          {/* Muestra la mesa en la que se realiza la orden */}
          {selectedTable && (
            <Text style={styles.orderTableInfo}>Table {selectedTable.id}</Text>
          )}
          {!selectedCategory && (
            <View style={styles.categoryContainer}>
              <TouchableOpacity 
                style={styles.categoryButton} 
                onPress={() => setSelectedCategory('entrada')}>
                <Text style={styles.categoryButtonText}>Appetizers</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.categoryButton} 
                onPress={() => setSelectedCategory('plato principal')}>
                <Text style={styles.categoryButtonText}>Main Dishes</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.categoryButton} 
                onPress={() => setSelectedCategory('postre')}>
                <Text style={styles.categoryButtonText}>Desserts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.categoryButton} 
                onPress={() => setSelectedCategory('bebida')}>
                <Text style={styles.categoryButtonText}>Beverages</Text>
              </TouchableOpacity>
            </View>
          )}

          {selectedCategory && (
            <>
              <View style={styles.backCategoryContainer}>
                <TouchableOpacity 
                  style={styles.backCategoryButton} 
                  onPress={() => setSelectedCategory(null)}>
                  <Text style={styles.backCategoryButtonText}>Go Back</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredMenuItems}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.menuItem} onPress={() => handleSelectMenuItem(item)}>
                    <Text style={styles.menuItemText}>{item.name}</Text>
                    <Text style={styles.menuItemText}>${item.price}</Text>
                  </TouchableOpacity>
                )}
              />
            </>
          )}

          {selectedMenuItem && (
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>
                Enter quantity for {selectedMenuItem.name}:
              </Text>
              <TextInput
                style={styles.quantityInput}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="numeric"
              />
              <TouchableOpacity style={styles.addButton} onPress={addItemToOrder}>
                <Text style={styles.addButtonText}>Add to Order</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowMenuModal(false)}>
            <Text style={styles.closeModalText}>Close Menu</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para ver y editar la orden */}
      <Modal visible={showOrderModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Customer Order</Text>
          {/* Muestra la mesa para la orden en el modal de orden */}
          {selectedTable && (
            <Text style={styles.orderTableInfo}>Table {selectedTable.id}</Text>
          )}
          <FlatList
            data={orderItems}
            keyExtractor={(item) => item.menuItemId}
            renderItem={({ item }) => (
              <View style={styles.orderItem}>
                <Text>{item.name}</Text>
                <Text>Quantity: {item.quantity}</Text>
                <TextInput
                  style={styles.quantityInput}
                  value={item.quantity.toString()}
                  keyboardType="numeric"
                  onChangeText={(text) =>
                    setOrderItems(orderItems.map(orderItem =>
                      orderItem.menuItemId === item.menuItemId
                        ? { ...orderItem, quantity: parseInt(text) }
                        : orderItem
                    ))
                  }
                />
                <TouchableOpacity onPress={() => setOrderItems(orderItems.filter(orderItem => orderItem.menuItemId !== item.menuItemId))}>
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          />
          <TouchableOpacity style={styles.sendOrderButton} onPress={sendOrder}>
            <Text style={styles.sendOrderButtonText}>Send Order</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeModalButton} onPress={() => setShowOrderModal(false)}>
            <Text>Close Order</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: { 
    color: '#347FC2',
    fontSize: 24, 
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 50,
    textAlign: 'center',
  },
  qrButton: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20,
  },
  qrButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  table: {
    padding: 15,
    borderWidth: 1,
    borderColor: '#CCC',
    marginBottom: 10,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  tableText: {
    fontSize: 16,
    alignSelf: 'center',
  },
  freeButton: {
    backgroundColor: '#DD1616',
    borderRadius: 5,
    padding: 5,
    alignSelf: 'center',
  },
  orderButton: {
    position: 'absolute',
    top: 55,
    right: 20,
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    marginTop: 30,
  },
  orderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 30,
    textAlign: 'center',
  },
  orderTableInfo: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    color: '#555',
    fontWeight: 'bold',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    margin: 5,
    marginBottom: 35,
    width: '80%',
  },
  categoryButtonText: {
    color: '#FFF',
    fontSize: 17,
    alignSelf: 'center',
    fontWeight: 'bold',
  },
  backCategoryContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  backCategoryButton: {
    backgroundColor: '#AAA',
    padding: 8,
    marginBottom: 20,
    borderRadius: 5,
  },
  backCategoryButtonText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  menuItem: {
    padding: 11,
    borderBottomWidth: 1,
    borderColor: '#EEE',
  },
  menuItemText: {
    fontSize: 15,
  },
  quantityContainer: {
    marginVertical: 20,
    alignItems: 'center',
  },
  quantityLabel: {
    fontSize: 15,
    marginBottom: 10,
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#CCC',
    padding: 5,
    marginBottom: 20,
    width: 60,
    textAlign: 'center',
    marginVertical: 10,
  },
  addButton: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
  },
  addButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  closeModalButton: {
    backgroundColor: '#AAA',
    padding: 10,
    borderRadius: 5,
    marginTop: 20,
    alignSelf: 'center',
  },
  closeModalText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
  orderItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#EEE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deleteText: {
    color: 'red',
    marginLeft: 10,
  },
  sendOrderButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    alignItems: 'center',
  },
  sendOrderButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  // Nuevo estilo para la vista de la cámara dentro del modal QR
  camera: {
    flex: 1,
    borderRadius: 10,
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 10,
  },
});