import React, { useContext, useEffect, useState } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import ScrollToTop from '../../components/ScrollToTop';
import { RoomContext } from '../../context/RoomContext';
import emailjs from '@emailjs/browser';


const AdminReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reservationToEdit, setReservationToEdit] = useState(null);

  // Added state for roomNumber
  const [roomNumber, setRoomNumber] = useState('');

  const [billModalVisible, setBillModalVisible] = useState(false);
  const [billDetails, setBillDetails] = useState(null);


  const {
    pname, setPName,
    email, setEmail,
    phone, setPhone,
    checkInDate, setCheckInDate,
    checkOutDate, setCheckOutDate,
    adults, setAdults,
    kids, setKids,
    rooms, selectedRoomId, selectedRoomName,
    setSelectedRoomId, setSelectedRoomName,
   
  } = useContext(RoomContext);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'reservations'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setReservations(data);
    } catch (err) {
      console.error('Error fetching reservations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      await updateDoc(doc(db, 'reservations', id), { status: 'booked' });
      alert('Reservation confirmed.');
      fetchReservations();
    } catch (err) {
      console.error('Error confirming:', err);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm('Are you sure you want to reject and delete this reservation?')) return;
    try {
      await deleteDoc(doc(db, 'reservations', id));
      alert('Reservation rejected and deleted.');
      fetchReservations();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const loadReservationIntoForm = (res) => {
    setPName(res.pname);
    setEmail(res.email);
    setPhone(res.phone);
    setCheckInDate(res.checkIn?.toDate?.() || new Date());
    setCheckOutDate(res.checkOut?.toDate?.() || new Date());
    setAdults(res.adults);
    setKids(res.kids);
    setSelectedRoomId(res.roomId);
    setSelectedRoomName(res.roomName);
    setRoomNumber(res.roomNumber || '');
  };

  const handleEdit = (res) => {
    setIsEditing(true);
    setReservationToEdit(res);
    loadReservationIntoForm(res);
    setShowModal(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setReservationToEdit(null);
    setRoomNumber(''); // reset room number when adding new
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const data = {
      pname,
      email,
      phone,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults,
      kids,
      roomId: selectedRoomId,
      roomName: selectedRoomName,
      roomNumber,          // <-- Added roomNumber here
      status: 'booked',
      [isEditing ? 'updatedAt' : 'createdAt']: new Date()
    };

    try {
      if (isEditing && reservationToEdit?.id) {
        await updateDoc(doc(db, 'reservations', reservationToEdit.id), data);
        alert('Reservation updated.');
      } else {
        await addDoc(collection(db, 'reservations'), data);
        alert('Reservation added.');
      }
      setShowModal(false);
      fetchReservations();
    } catch (err) {
      console.error('Error saving:', err);
      alert('Something went wrong.');
    }
  };

const generateBill = async (reservation) => {
  try {
    const roomDoc = await getDocs(collection(db, 'rooms'));
    const roomList = roomDoc.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    const room = roomList.find(r => r.id === reservation.roomId);

    if (!room) {
      alert('Room information not found!');
      return;
    }

    const roomPrice = room.price || 0;
    const checkIn = reservation.checkIn?.toDate ? reservation.checkIn.toDate() : new Date(reservation.checkIn);
    const checkOut = reservation.checkOut?.toDate ? reservation.checkOut.toDate() : new Date(reservation.checkOut);

    const msPerDay = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((checkOut - checkIn) / msPerDay);

    if (nights <= 0) {
      alert('Invalid stay duration.');
      return;
    }

    const baseAmount = roomPrice * nights;
    const hstRate = 0.13;
    const hstAmount = baseAmount * hstRate;
    const totalAmount = baseAmount + hstAmount;

    setBillDetails({
      guest: reservation.pname,
      roomName: room.name,
      roomNumber: reservation.roomNumber || 'N/A',
      checkIn: checkIn.toDateString(),
      checkOut: checkOut.toDateString(),
      nights,
      roomPrice,
      baseAmount,
      hstAmount,
      totalAmount,
      email: reservation.email
    });

    setBillModalVisible(true);
  } catch (error) {
    console.error('Error generating bill:', error);
    alert('Failed to calculate bill.');
  }
};


const sendBillToEmail = async () => {
  if (!billDetails) return;


  console.log(billDetails);
  try {
    await emailjs.send(
      'service_d3cy1e9',
      'template_11t5n5a',
      {
        guest: billDetails.guest,
        room_name: billDetails.roomName,
        room_number: billDetails.roomNumber,
        check_in: billDetails.checkIn,
        check_out: billDetails.checkOut,
        nights: billDetails.nights,
        rate: `$${billDetails.roomPrice.toFixed(2)}`,
        subtotal: `$${billDetails.baseAmount.toFixed(2)}`,
        hst: `$${billDetails.hstAmount.toFixed(2)}`,
        total: `$${billDetails.totalAmount.toFixed(2)}`,
        to_email: billDetails.email 
      },
      '8nzBG6xAhz4eIyVij'
    );
    alert('Bill sent to customer email!');
  } catch (error) {
    console.error('EmailJS send failed:', error);
    alert('Failed to send email');
  }
};




  const renderTable = (data, isPending) => (
    <div className="overflow-x-auto mt-6 bg-white shadow-xl rounded-2xl">
      <table className="min-w-full text-sm text-center border-collapse">
        <thead className="bg-black text-white text-sm uppercase tracking-wider">
          <tr>
            {/* Added "Room No." column */}
            {['Room', 'Room No.', 'Name', 'Email', 'Phone', 'Check-in', 'Check-out', 'Guests', 'Status', 'Actions'].map(h => (
              <th key={h} className="px-4 py-3 border-b border-white">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="text-gray-700">
          {data.map(res => (
            <tr key={res.id} className="hover:bg-[#fdf8f3] transition duration-200">
              <td className="px-4 py-3 border-b">{res.roomName}</td>
              <td className="px-4 py-3 border-b">{res.roomNumber || 'N/A'}</td> {/* Room Number cell */}
              <td className="px-4 py-3 border-b">{res.pname}</td>
              <td className="px-4 py-3 border-b">{res.email}</td>
              <td className="px-4 py-3 border-b">{res.phone}</td>
              <td className="px-4 py-3 border-b">{res.checkIn?.toDate().toLocaleDateString()}</td>
              <td className="px-4 py-3 border-b">{res.checkOut?.toDate().toLocaleDateString()}</td>
              <td className="px-4 py-3 border-b">{res.adults} Adults, {res.kids} Kids</td>
              <td className="px-4 py-3 border-b">
                <span className={`inline-block px-2 py-1 rounded-full ${res.status === 'booked' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                  {res.status === 'booked' ? 'Booked' : 'Pending'}
                </span>
              </td>
              <td className="px-4 py-3 border-b space-x-2">
                {isPending ? (
                  <>
                    <button onClick={() => handleConfirm(res.id)} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg">Confirm</button>
                    <button onClick={() => handleReject(res.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">Reject</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => handleEdit(res)} className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-lg">Edit</button>
                     <button onClick={() => generateBill(res)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg">Create Receip</button>
                    <button onClick={() => handleReject(res.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg">Remove</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const pendingReservations = reservations.filter(r => r.status !== 'booked');
  const confirmedReservations = reservations.filter(r => r.status === 'booked');

  return (
    <section>
      <ScrollToTop />
      <div className="bg-room bg-cover bg-center h-[560px] relative flex justify-center items-center">
        <div className="absolute w-full h-full bg-black/70"></div>
        <h1 className="text-6xl text-white z-20 font-primary text-center">Admin Reservations</h1>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {loading ? (
          <p className="text-center text-gray-500 text-lg">Loading reservations...</p>
        ) : (
          <>
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">📝 Pending Reservations</h2>
            {pendingReservations.length ? renderTable(pendingReservations, true) : <p className="text-gray-600 mb-10">No pending reservations found.</p>}

            <h2 className="text-2xl font-semibold text-green-700 mt-12 mb-4">✅ Confirmed Reservations</h2>
            <button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg mb-6">+ Add Confirmed Reservation</button>
            {confirmedReservations.length ? renderTable(confirmedReservations, false) : <p className="text-gray-600">No confirmed reservations found.</p>}
          </>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-xl w-full relative">
            <h2 className="text-xl font-bold mb-4">{isEditing ? 'Edit Reservation' : 'Add Confirmed Reservation'}</h2>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <input value={pname} onChange={(e) => setPName(e.target.value)} required className="input" placeholder="Name" />
              <input value={email} onChange={(e) => setEmail(e.target.value)} required className="input" placeholder="Email" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} required className="input" placeholder="Phone" />

              {/* Room Number input */}
              <input
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                required
                className="input"
                placeholder="Room Number"
              />

              <div className="flex gap-4">
                <input type="date" value={checkInDate ? new Date(checkInDate).toISOString().split('T')[0] : ''} onChange={(e) => setCheckInDate(new Date(e.target.value))} required className="input w-full" />
                <input type="date" value={checkOutDate ? new Date(checkOutDate).toISOString().split('T')[0] : ''} onChange={(e) => setCheckOutDate(new Date(e.target.value))} required className="input w-full" />
              </div>

              <div className="flex gap-4">
                <input type="number" value={adults} onChange={(e) => setAdults(parseInt(e.target.value))} min={1} required className="input w-full" placeholder="Adults" />
                <input type="number" value={kids} onChange={(e) => setKids(parseInt(e.target.value))} min={0} required className="input w-full" placeholder="Kids" />
              </div>

              <select value={selectedRoomId} onChange={(e) => {
                const selected = rooms.find(r => r.id === e.target.value);
                setSelectedRoomId(selected?.id || '');
                setSelectedRoomName(selected?.name || '');
              }} required className="input w-full">
                <option value="">Select Room</option>
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>{room.name}</option>
                ))}
              </select>

              <div className="flex justify-end gap-4">
                <button type="button" onClick={() => setShowModal(false)} className="bg-gray-300 px-4 py-2 rounded">Cancel</button>
                <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">{isEditing ? 'Update' : 'Add'}</button>
              </div>
            </form>
          </div>
        </div>
      )}


      {billModalVisible && billDetails && (
  <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex justify-center items-center">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md relative">
      <h2 className="text-xl font-bold mb-4">Reservation Bill</h2>
      <div className="text-sm space-y-2">
        <p><strong>Guest:</strong> {billDetails.guest}</p>
        <p><strong>Room:</strong> {billDetails.roomName}</p>
        <p><strong>Room No:</strong> {billDetails.roomNumber}</p>
        <p><strong>Check-in:</strong> {billDetails.checkIn}</p>
        <p><strong>Check-out:</strong> {billDetails.checkOut}</p>
        <p><strong>Nights:</strong> {billDetails.nights}</p>
        <p><strong>Rate:</strong> ${billDetails.roomPrice.toFixed(2)}/night</p>
        <hr />
        <p><strong>Subtotal:</strong> ${billDetails.baseAmount.toFixed(2)}</p>
        <p><strong>HST (13%):</strong> ${billDetails.hstAmount.toFixed(2)}</p>
        <p><strong>Total:</strong> <span className="text-green-700 font-bold">${billDetails.totalAmount.toFixed(2)}</span></p>
      </div>
      <button
        onClick={sendBillToEmail}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded ml-2"
      >
        Send to Email
      </button>
      <div className="flex justify-end mt-6">
        <button onClick={() => setBillModalVisible(false)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded">
          Close
        </button>
      </div>
    </div>
  </div>
)}

    </section>
  );
};

export default AdminReservations;
