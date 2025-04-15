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
  Image
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

// Importar funciones de Firestore para la suscripción en tiempo real
import { collection, onSnapshot } from "firebase/firestore";
import { db } from '../utils/FireBaseConfig';
import CustomButton from '@/components/CustomButton';

export default function WaiterScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const {
    tables,
    selectTable,
    selectedTable,
    createOrder,
    addOrderItem,
    freeTable, // Función para liberar la mesa
    showPopup,
    orderForPopup,
    setShowPopup,
    loadTables, // Función definida en WaiterContext para cargar las mesas
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

  // Permisos y configuración de la cámara usando expo-camera
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');

  useEffect(() => {
    setMounted(true);
    // Cargar los items del menú (consulta única)
    getMenuItems();

    // Configurar la suscripción en tiempo real a la colección "tables".
    // Cada vez que se detecte un cambio, se ejecuta loadTables para actualizar el estado.
    const unsubscribe = onSnapshot(collection(db, "tables"), (snapshot) => {
      loadTables();
      console.log("Changes in the tables have been detected.");
    });

    // Limpieza de la suscripción al desmontar
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'mesero')) {
      router.replace('./index');
    }
  }, [user, mounted]);

  // Manejo del escaneo del QR usando expo-camera
  const handleBarCodeScanned = ({ type, data }: { type: string; data: string }) => {
    setShowQRScanner(false);
    // Se espera que el QR contenga un identificador de mesa (por ejemplo, "table_X")
    if (/^\d+$/.test(data)) {
      const tableId = data;
      selectTable(tableId);
      setShowMenuModal(true);
      setSelectedCategory(null);
    } else {
      Alert.alert('Invalid QR code', 'The QR code must be valid for a table.');
    }
  };

  // Manejador para abrir el escáner QR
  const handleOpenQRScanner = () => {
    setShowQRScanner(true);
  };

  // Selección de una mesa
  const handleSelectTable = (table: Table) => {
    if (table.status === 'disponible') {
      selectTable(table.id);
      setShowMenuModal(true);
      setSelectedCategory(null);
    } else {
      Alert.alert(`Table ${table.id} occupied`, 'This table is currently occupied. Please try again later.');
      // Si la mesa está ocupada, se cargan los ítems de la orden actual.
      const currentOrderItems = tables.find(item => item.id === table.id)?.orderItems;
      if (currentOrderItems) {
        setOrderItems(currentOrderItems);
      }
    }
  };

  // Libera la mesa y borra la orden asociada
  const handleFreeTable = async (tableId: string) => {
    try {
      await freeTable(tableId);
      Alert.alert(`Table ${tableId} liberated!`, `You may now create a new order for this table.`);
    } catch (error) {
      console.error('Error liberating table:', error);
      Alert.alert('Error', 'Table could not be liberated');
    }
  };

  const handleSelectMenuItem = (menuItem: MenuItem) => {
    setSelectedMenuItem(menuItem);
    setQuantity('1');
  };

  // Función para añadir ítems a la orden.
  // Si la mesa ya tiene un orderId, se utiliza ese para agregar el ítem adicional.
  const addItemToOrder = async () => {
    if (!selectedMenuItem) return;
    const parsedQuantity = parseInt(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      Alert.alert('Invalid amount', 'Please enter an amount greater than 0.');
      return;
    }
    // Buscar si ya existe el ítem en la orden actual.
    const existingIndex = orderItems.findIndex(item => item.menuItemId === selectedMenuItem.id);
    let updatedItems: OrderItem[];
    if (existingIndex > -1) {
      updatedItems = [...orderItems];
      updatedItems[existingIndex].quantity += parsedQuantity;
      setOrderItems(updatedItems);
      // Si la mesa tiene un pedido activo, usamos su orderId para agregar el ítem extra.
      if (selectedTable?.orderId) {
        await addOrderItem(selectedTable.orderId, updatedItems[existingIndex]);
      }
    } else {
      const newItem: OrderItem = {
        menuItemId: selectedMenuItem.id,
        name: selectedMenuItem.name,
        quantity: parsedQuantity,
        price: selectedMenuItem.price,
      };
      updatedItems = [...orderItems, newItem];
      setOrderItems(updatedItems);
      if (selectedTable?.orderId) {
        await addOrderItem(selectedTable.orderId, newItem);
      }
    }
    Alert.alert("Item added!", "The item has been added successfully.");
    setSelectedMenuItem(null);
    setQuantity('1');
  };

  const sendOrder = async () => {
    if (!selectedTable) return;
    await createOrder(selectedTable.id, orderItems);
    Alert.alert('Order created!', 'The order has been sent to the kitchen successfully.');
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
      <TouchableOpacity style={styles.qrButton} onPress={handleOpenQRScanner}>
        <Image 
          source={require('../assets/images/codigo-qr.png')}
          style={{ width: 25, height: 25, marginRight: 10 }}
        />
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

      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.orderButton} onPress={() => setShowOrderModal(true)}>
          <Text style={styles.orderButtonText}>View Order</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonsContainer}>
        {/* Modal para escanear QR utilizando expo-camera */}
        <Modal visible={showQRScanner} animationType="slide">
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Scan QR Code</Text>
            {(!permission || !permission.granted) ? (
              <View style={styles.permissionContainer}>
                <Text style={styles.modalText}>Requesting permission for the camera...</Text>
                <CustomButton onPress={requestPermission} title="Grant permission" />
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
        {/* Botón de Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => {
            logout();
            router.replace('./');
          }}
        >
          <Image 
            source={require('../assets/images/salir.png')}
            style={{ width: 25, height: 25, marginRight: 10 }}
          />
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>

      {/* Popup de la orden lista */}
      <Modal visible={showPopup} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.orderReadyTitle}>Order Ready!</Text>
          {orderForPopup && (
            <>
              <Text style={styles.orderReadyText}>Order ID: {orderForPopup.id}</Text>
              <Text style={styles.orderReadyText}>Total: ${orderForPopup.total}</Text>
            </>
          )}
          <TouchableOpacity style={styles.orderReadyCloseButton} onPress={() => setShowPopup(false)}>
            <Text style={styles.orderReadyCloseButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal para seleccionar platos del menú */}
      <Modal visible={showMenuModal} animationType="slide">
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Menu</Text>
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
                    <View style={styles.menuItemInfo}>
                      <View style={styles.menuItemTextContainer}>
                        <Text style={styles.menuItemText}>{item.name}</Text>
                        <Text style={styles.menuItemPrice}>${item.price}</Text>
                        <Text style={styles.menuItemDescription}>{item.description}</Text>
                      </View>
                      <Image 
                        source={{ uri: item.imageUrl }}
                        style={styles.menuItemImage}
                      />
                    </View>
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
            <Text style={styles.closeModalText}>Go Back</Text>
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
    marginTop: 25,
    marginBottom: 30,
    textAlign: 'center',
  },
  orderButton: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    marginTop: 30,
  },
  orderButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  qrButton: {
    backgroundColor: '#347FC2',
    padding: 10,
    borderRadius: 5,
    alignSelf: 'center',
    marginBottom: 20,
    display: 'flex',
    flexDirection: 'row',
  },
  qrButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  logoutButton: {
    backgroundColor: '#DD1616',
    borderRadius: 5,
    marginTop: 15,
    padding: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFF',
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 10,
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
  orderReadyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: '10%',
    marginTop: 30,
    textAlign: 'center',
  },
  orderReadyText: {
    fontSize: 18,
  },
  orderReadyCloseButton: {
    backgroundColor: '#347FC2', 
    padding: 15, 
    borderRadius: 10, 
    width: '40%', 
    alignItems: 'center', 
    alignSelf: 'center',
    marginTop: '10%',
    marginBottom: '3%' 
  },
  orderReadyCloseButtonText: {
    color: '#FFF', 
    fontSize: 18, 
    fontWeight: 'bold',
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
  menuItemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuItemPrice: {
    fontSize: 16,
    color: '#347FC2',
    marginTop: 2,
  },
  menuItemDescription: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
  },
  menuItemImage: {
    width: 60,
    height: 60,
    borderRadius: 5,
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
    fontWeight: 'bold',
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
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFF',
  },
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
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 10,
  },
});