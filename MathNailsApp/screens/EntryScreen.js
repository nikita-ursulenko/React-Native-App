import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, LayoutAnimation, ScrollView } from 'react-native';
import { AddButton, ButtonSpecial, CustomModal, ModalDialog } from '../components/components';
import { AntDesign, FontAwesome5, FontAwesome } from '@expo/vector-icons';
import DataBase from '../data/data';
import moment from 'moment';
import 'moment/locale/ru';
moment.locale('ru');

// Компонент развернутого раздела
const ExpandableSection = ({ title, children, setSelectedDate, setSelectedIndex, setShowModal }) => {
  const [expanded, setExpanded] = useState(false);
  const dayOfWeek = moment(title, 'YY.MM.DD').format('dddd');
  // Преобразуем первую букву в заглавную
  const capitalizedDay = dayOfWeek.charAt(0).toUpperCase() + dayOfWeek.slice(1);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View>
      <TouchableOpacity onPress={toggleExpand} style={styles.sectionHeader}>
        <View style={{flexDirection: "row"}}>
          <Text style={styles.headerText}>{capitalizedDay} </Text>
          <Text style={styles.headerText}>{title}</Text>
        </View>
        {expanded ? (
          <AntDesign name="upcircle" size={30} color="black" />
        ) : (
          <AntDesign name="downcircleo" size={30} color="black" />
        )}
      </TouchableOpacity>
      {expanded && (
        <View style={styles.content}>
          {React.Children.map(children, (child, index) => {
            // Разделяем содержимое child на отдельные элементы
            const parts = child.props.children;
            const icon = parts[4] === 'Bar' ? (
              <FontAwesome5 name="money-bill-wave" size={30} color="green" />
            ) : (
              <FontAwesome name="credit-card-alt" size={30} color="blue" />
            );
            return (
              <TouchableOpacity style={styles.contentItem} key={index}  onPress={() => {
                setSelectedDate(title);
                setSelectedIndex(index);
                setShowModal(true);
              }}>
                <View style={{maxWidth: "60%"}}>
                  <Text style={styles.contentItemText}>{parts[0]}</Text>
                </View>
                  {parts[6] ? 
                  <View style={{ borderBottomWidth: 2, borderColor: "red", alignSelf: "center"}}>
                    <Text style={{ fontSize: 20 }}>{parts[6]}</Text>
                  </View> : ''} 
                <View style={{minHeight: 50, flexDirection: "row", alignItems: "center"}}>
                  <Text style={{fontWeight: 700, fontSize: 24,}}>{parts[2]}€ </Text>
                    <View>
                    {icon}
                    </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const EntryScreen = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [workDone, setWorkDone] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [appointmentData, setAppointmentData] = useState({});

  
  useEffect(() => {
    const loadWorkDone = async () => {
      try {
        const workDoneData = await DataBase.WorkDone.getDataFromDB();
        if (workDoneData) {
          const sortedWorkDone = Object.keys(workDoneData)
          .sort((a, b) => new Date(b) - new Date(a))
          .reduce((acc, key) => {
            acc[key] = workDoneData[key];
            return acc;
          }, {});
          setWorkDone(sortedWorkDone);
        } else {
          console.log('No data found in the database.');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadWorkDone();
  }, []);
  
  // Состояние модального окна
  const toggleModal = () => {
    setIsModalVisible(!isModalVisible);
  };

  const toggleHandleEditItem = (selectedDate, selectedIndex) => {
    setIsModalVisible(!isModalVisible);
    setShowModal(!showModal);
    setAppointmentData({
      ...appointmentData,
      selectedDate: selectedDate,
      selectedIndex: selectedIndex,
    });
  };
  //Ручное удаление данных
  const handleDeleteItem = async (date, index) => {
    // Удаление элемента из базы данных по индексу
    // Обновление данных на экране
    console.log('Deleted item:', date, index);
    await DataBase.WorkDone.deleteItemFromDB(date, index);
    setShowModal(false);
    loadWorkDone();
  };
  // Ручное добавление данных
  const handleAdd = async (data) => {
    // Здесь вы можете использовать полученные данные
    console.log('Received data:', data);
    await DataBase.WorkDone.saveDataToDB(data);
    loadWorkDone();
  };
  // Получение данных, из компонент
  const { modalContent } = CustomModal({
    visible: isModalVisible,
    onClose: toggleModal,
    onAdd: handleAdd,
    appointmentData: { selectedDate, selectedIndex, workDone },
  });
  // Загрузка данных из ДБ
  const loadWorkDone = async () => {
    const workDoneList = await DataBase.WorkDone.getDataFromDB();
    if (workDoneList) {
      console.log('Work done:', workDoneList);
      setWorkDone(workDoneList);
    } else {
      console.log('No data found in the database.');
    }
  };

  return (
    <View style={styles.container} animationType="slide">
      <ScrollView>
        <View style={styles.container}>
          {Object.keys(workDone).map((date) => (
            <ExpandableSection 
            key={date} title={date} 
            setSelectedDate={setSelectedDate}
            setSelectedIndex={setSelectedIndex}
            setShowModal={setShowModal}>
              {workDone[date].map((appointment, index) => {
                return (
                  <Text key={index} style={styles.serviceItem}>
                    {appointment.service.name} - {appointment.cost} - {appointment.paymentMethod} - {appointment.person} - {appointment.clientName}
                  </Text>
                );
              })}
            </ExpandableSection>
          ))}
        </View>
      </ScrollView>
      {modalContent}
      <AddButton onPress={toggleModal} />
      <ModalDialog
        visible={showModal}
        onClose={() => setShowModal(false)}
        onEdit={() => toggleHandleEditItem(selectedDate, selectedIndex)}
        onDelete={() => handleDeleteItem(selectedDate, selectedIndex)}
      />
      <ButtonSpecial onPress={DataBase.WorkDone.clearDataFromDB}/>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 5,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
    marginVertical: 2,
    padding: 10,
    borderWidth: 2,
    borderColor: 'black',
    borderBottomWidth: 1,
  },
  headerText: {
    fontSize: 20,
  },
  content: {
    padding: 10,
    backgroundColor: '#f9c2ff',
  },
  contentItem: {
    backgroundColor: "#33B5FF",
    paddingHorizontal: 5,
    marginVertical: 5,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  contentItemText: {
    fontSize: 24,   
  },
  serviceItem: {

  },
});

export default EntryScreen;
