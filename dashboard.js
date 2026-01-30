// ==================== CONFIGURATION & HELPER FUNCTIONS ====================

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/newapi'
    : 'https://updatedhotelmanagement.onrender.com/newapi';

const rooms = { first: [], second: [], third: [] };
const HOTEL_ADDRESS = `ADDRESS: NAGAR, SHRIDI ROAD, GUHA, TALUKA RAHURI,
DIST: AHILYANAGAR, STATE: MAHARASHTRA, PINCODE: 413706`;


const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1bfzwqGH20vhZi3PxpMhQglDg_aHsmZes';
var bookinglength

let foodItems = [
    { id: 1, name: 'KAJU CURRY', price: 200 },
    { id: 2, name: 'PANEER BUTTER', price: 180 },
    { id: 3, name: 'PANEER TIKKA', price: 190 },
    { id: 4, name: 'DAAL TADKA', price: 150 },
    { id: 5, name: 'DAAL FRY', price: 120 },
    { id: 6, name: 'PANEER BHURJI', price: 230 },
    { id: 7, name: 'VEG KOLHAPURI', price: 160 },
    { id: 8, name: 'MIX VEG', price: 160 },
    { id: 9, name: 'SHEVBHAJI', price: 130 },
    { id: 10, name: 'MALAI KOFTA', price: 220 },
    { id: 11, name: 'PANEER CHILLY', price: 220 },
    { id: 12, name: 'VEG MANCHURIAN', price: 180 },
    { id: 13, name: 'SOYABEAN CHILLY', price: 160 },
    { id: 14, name: 'CHEESE PAKODA', price: 180 },
    { id: 15, name: 'MASALA PAPAD', price: 45 },
    { id: 16, name: 'PLAIN ROTI', price: 20 },
    { id: 17, name: 'CHAPATI', price: 20 },
    { id: 18, name: 'BUTTER ROTI', price: 30 },
    { id: 19, name: 'BUTTER NAAN', price: 45 },
    { id: 20, name: 'BHAKARI', price: 30 },
    { id: 21, name: 'JEERA RICE', price: 130 },
    { id: 22, name: 'MASALA RICE', price: 160 },
    { id: 23, name: 'FRIED RICE', price: 150 },
    { id: 24, name: 'SPRITE', price: 20 },
    { id: 25, name: 'THUMS UP', price: 25 }
];

let filteredFoodItems = [...foodItems];
let bookings = [], customers = [], payments = [], staff = [], attendance = [];
let attendanceData = {};
let currentAttendanceMonth = new Date();
let currentAttendanceView = 'calendar';
let selectedRooms = [];
let foodOrder = {}, bookingCounter = 1, currentTheme = 'light';
let currentBookingForFood = null;
let currentEditingFoodItem = null;

// ==================== HELPER FUNCTIONS ====================

function loadFoodItems() {
    const saved = localStorage.getItem('hotelFoodItems');
    if (saved) { 
        foodItems = JSON.parse(saved); 
        filteredFoodItems = [...foodItems]; 
    }
}

function saveFoodItems() {
    localStorage.setItem('hotelFoodItems', JSON.stringify(foodItems));
}

function loadAttendanceData() {
    const saved = localStorage.getItem('hotelAttendanceCalendar');
    if (saved) {
        attendanceData = JSON.parse(saved);
    }
}

function saveAttendanceData() {
    localStorage.setItem('hotelAttendanceCalendar', JSON.stringify(attendanceData));
}

function toggleTheme() {
    const body = document.body, themeIcon = document.getElementById('themeIcon');
    if (currentTheme === 'light') {
        body.classList.add('dark-theme');
        themeIcon.textContent = '☀️';
        currentTheme = 'dark';
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-theme');
        themeIcon.textContent = '🌙';
        currentTheme = 'light';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const themeIcon = document.getElementById('themeIcon');
        if (themeIcon) themeIcon.textContent = '☀️';
        currentTheme = 'dark';
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.href = 'login.html';
    }
}

function calculateNights(checkIn, checkOut) {
    if (!checkIn || !checkOut) return 1;
    
    let start, end;
    
    if (checkIn.includes('/')) {
        const parts = checkIn.split('/');
        start = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        start = new Date(checkIn);
    }
    
    if (checkOut.includes('/')) {
        const parts = checkOut.split('/');
        end = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        end = new Date(checkOut);
    }
    
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays || 1;
}

function toggleMobileMenu() {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('mobile-open');
    }
}

// ==================== DOCUMENT MANAGEMENT ====================

function displayFileName(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    if (input && input.files && input.files[0]) {
        const file = input.files[0];
        const fileSize = (file.size / 1024 / 1024).toFixed(2);
        
        if (file.size > 5 * 1024 * 1024) {
            display.textContent = '❌ File too large (max 5MB)';
            display.style.color = '#e74c3c';
            input.value = '';
            return;
        }
        
        display.textContent = `✅ ${file.name} (${fileSize} MB)`;
        display.style.color = '#27ae60';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
}

async function uploadDocuments(customerId, bookingId) {
    const documents = [];
    const fileInputs = ['doc1Front', 'doc1Back', 'doc2Front', 'doc2Back'];
    
    for (const inputId of fileInputs) {
        const input = document.getElementById(inputId);
        if (input && input.files && input.files[0]) {
            try {
                const file = input.files[0];
                const base64Data = await fileToBase64(file);
                
                documents.push({
                    name: file.name,
                    data: base64Data,
                    type: file.type
                });
            } catch (error) {
                console.error('Error reading file:', error);
            }
        }
    }
    
    if (documents.length === 0) {
        return null;
    }
    
    try {
        const response = await fetch(`${API_URL}/documents/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId: customerId,
                bookingId: bookingId,
                documents: documents
            })
        });
        
        const result = await response.json();
        
        if (result.googleDriveFolderUrl) {
            alert(
                `📄 ${documents.length} document(s) ready for upload!\n\n` +
                `📁 Please upload them to Google Drive:\n${result.googleDriveFolderUrl}\n\n` +
                `Files: ${documents.map(d => d.name).join(', ')}`
            );
        }
        
        return result.documents || null;
    } catch (error) {
        console.error('Document upload error:', error);
        return null;
    }
}

// ✅ FIX: View documents with download option
async function viewCustomerDocuments(customerId) {
    try {
        const customer = customers.find(c => c['Customer ID'] === customerId);
        
        if (!customer || !customer.documents || customer.documents.length === 0) {
            alert(
                `📄 No documents for this customer\n\n` +
                `📁 All documents are stored in:\n${GOOGLE_DRIVE_FOLDER_URL}`
            );
            return;
        }
        
        // Create modal to show documents
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h2>📄 Customer Documents</h2>
                    <span class="close-btn" onclick="this.closest('.modal').remove()">×</span>
                </div>
                <div style="margin: 20px 0;">
                    <p><strong>Customer:</strong> ${customer.Name}</p>
                    <p><strong>Mobile:</strong> ${customer.Mobile}</p>
                    </p>
                    <h3 style="margin-top: 20px;">Uploaded Documents:</h3>
                    <div style="max-height: 300px; overflow-y: auto;">
                        ${customer.documents.map((doc, i) => `
                            <div style="padding: 10px; margin: 5px 0; background: #f8f9fa; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
                                <div>
                                    <strong>${i + 1}. ${doc.originalName || doc.filename}</strong><br>
                                    <small style="color: #666;">Uploaded: ${new Date(doc.uploadDate).toLocaleString()}</small>
                                </div>
                                <a href="${doc.url}" download class="btn btn-primary" style="padding: 8px 15px; text-decoration: none; white-space: nowrap;">
                                    ⬇️ Download
                                </a>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
    } catch (error) {
        console.error('Error viewing documents:', error);
        alert('❌ Error loading documents');
    }
}

// ==================== MAIN INITIALIZATION ====================

window.addEventListener('DOMContentLoaded', async function() {
    loadTheme();
    loadFoodItems();
    loadAttendanceData();
    await loadAllData();
    initializeFoodMenu();
    renderFoodMenuManager();
    renderAttendanceCalendar();
    
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) bookingForm.addEventListener('submit', handleBookingSubmit);
    
    const advanceBookingForm = document.getElementById('advanceBookingForm');
    if (advanceBookingForm) advanceBookingForm.addEventListener('submit', handleAdvanceBookingSubmit);
    
    const checkInDate = document.getElementById('checkInDate');
    const checkOutDate = document.getElementById('checkOutDate');
    
    if (checkInDate && checkOutDate) {
        const updateCalculations = () => {
            if (checkInDate.value && checkOutDate.value) {
                const nights = calculateNights(checkInDate.value, checkOutDate.value);
                const numNightsField = document.getElementById('numNights');
                if (numNightsField) {
                    numNightsField.value = nights;
                }
            }
        };
        checkInDate.addEventListener('change', updateCalculations);
        checkOutDate.addEventListener('change', updateCalculations);
    }
});

async function loadAllData() {
    try {
        console.log('📄 Loading data from server...');
        
        /* ===================== ROOMS ===================== */
        const roomsResponse = await fetch(`${API_URL}/rooms`);
        const roomsData = await roomsResponse.json();
        console.log('rooms data',roomsData)
        
        rooms.first = roomsData
            .filter(r => r.Floor === 'first' || r.floor=='first')
            .map(r => ({
                number: r['Room Number'] || r.roomNumber,
                status: r.Status || r.status || 'available',
                price: r.Price || r.price || 0,
                type: r.Type || r.type || 'Non AC'
            }));

        rooms.second = roomsData
            .filter(r => r.Floor === 'second'||r.floor=='second' )
            .map(r => ({
                number: r['Room Number'] || r.roomNumber,
                status: r.Status || r.status || 'available',
                price: r.Price || r.price || 0,
                type: r.Type || r.type || 'Non AC'
            }));

        rooms.third = roomsData
            .filter(r => r.Floor === 'third'||r.floor=='third')
            .map(r => ({
                number: r['Room Number'] || r.roomNumber,
                status: r.Status || r.status || 'available',
                price: r.Price || r.price || 0,
                type: r.Type || r.type || 'AC'
            }));

        console.log('✅ Rooms loaded:', rooms);

        /* ===================== BOOKINGS ===================== */
        const bookingsResponse = await fetch(`${API_URL}/bookings`);
        
        const rawBookings = await bookingsResponse.json();
        console.log('booking data',rawBookings)

        bookings = rawBookings.map(b => ({
            ...b,

            // Normalize IDs
            'Booking ID': b['Booking ID'] || b.bookingId,

            // Normalize dates
            'Check In': b['Check In'] || b.checkIn,
            'Check Out': b['Check Out'] || b.checkOut,

            // Normalize prices
            'Room Amount': b['Room Amount'] || b.roomAmount,
            'Room Price Per Night': b['Room Price Per Night'] || b.roomPricePerNight,

            Nights: b.Nights || b.nights
        }));

        // Auto-calculate missing values
        bookings.forEach(b => {
            if (!b.Nights && b['Check In'] && b['Check Out']) {
                b.Nights = calculateNights(b['Check In'], b['Check Out']);
            }

            if (!b['Room Price Per Night'] && b['Room Amount'] && b.Nights) {
                b['Room Price Per Night'] = Math.floor(b['Room Amount'] / b.Nights);
            }
        });

        console.log('✅ Bookings loaded:', bookings.length);

        // Booking counter (safe)
        const ids = bookings
            .map(b => b['Booking ID'])
            .filter(id => typeof id === 'string')
            .map(id => parseInt(id.replace('BK', '')));

        bookingCounter = ids.length > 0 ? Math.max(...ids) + 1 : 1;

        /* ===================== OTHER DATA ===================== */
        customers   = await (await fetch(`${API_URL}/customers`)).json();
        payments    = await (await fetch(`${API_URL}/payments`)).json();
        staff       = await (await fetch(`${API_URL}/staff`)).json();
        attendance  = await (await fetch(`${API_URL}/attendance`)).json();

        console.log('✅ All data loaded successfully');
        console.log(`📊 Stats - Bookings: ${bookings.length}, Customers: ${customers.length}`);

        /* ===================== UI UPDATES ===================== */
        updateRoomStatusFromBookings();
        initializeRooms();
        updateDashboard();
        updateAllTables();
        updateStaffTable();

    } catch (error) {
        console.error('❌ Error loading data:', error);
        alert('⚠️ Server connection failed. Make sure server is running on http://localhost:3001');
    }
}


function updateRoomStatusFromBookings() {
  //onst confirmedBookings = bookings.filter(b => b.Status === 'Confirmed');
    const confirmedBookings = bookings?.filter(b=> b.status==='Confirmed');
 
    //var bookinglength = confirmedBookings.len
    
    
    confirmedBookings.forEach(booking => {
        if (booking['Room Number'] && !booking['Room Number'].includes('TBD')) {
            const roomNumbers = booking['Room Number'].split(', ');
            roomNumbers.forEach(roomNum => {
                for (let floor in rooms) {
                    const room = rooms[floor].find(r => r.number === roomNum.trim());
                    if (room) {
                        room.status = 'occupied';
                    }
                }
            });
        }
    });
}

function initializeRooms() {
    renderRoomBoxes('firstFloor', rooms.first);
    renderRoomBoxes('secondFloor', rooms.second);
    renderRoomBoxes('thirdFloor', rooms.third);
    renderRoomStatus();
}

function renderRoomBoxes(containerId, roomList) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    roomList.forEach(room => {
        const box = document.createElement('div');
        box.className = `room-box ${room.status}`;
        box.innerHTML = `${room.number}<br><small>${room.type}</small>`;
        if (room.status === 'available') {
            box.onclick = () => selectRoom(room, box);
        }
        container.appendChild(box);
    });
}

function selectRoom(room, boxElement) {
    const index = selectedRooms.findIndex(r => r.number === room.number);
    
    if (index !== -1) {
        selectedRooms.splice(index, 1);
        boxElement.classList.remove('selected');
    } else {
        selectedRooms.push(room);
        boxElement.classList.add('selected');
    }
    
    updateSelectedRoomsList();
}

function updateSelectedRoomsList() {
    const listElement = document.getElementById('selectedRoomsList');
    if (!listElement) return;
    
    if (selectedRooms.length === 0) {
        listElement.textContent = 'None';
        listElement.style.color = '#e74c3c';
    } else {
        listElement.textContent = selectedRooms.map(r => `${r.number} (${r.type})`).join(', ');
        listElement.style.color = '#27ae60';
    }
}

function renderRoomStatus() {
    const container = document.getElementById('roomsStatus');
    if (!container) return;
    let html = '';
    const floors = [
        { name: 'First Floor', rooms: rooms.first },
        { name: 'Second Floor', rooms: rooms.second },
        { name: 'Third Floor', rooms: rooms.third }
    ];
    floors.forEach(floor => {
        html += `<div class="floor-section"><div class="floor-title">${floor.name}</div><div class="room-selector">`;
        floor.rooms.forEach(room => {
            html += `<div class="room-box ${room.status}">${room.number}<br><small>${room.type}</small><br><small style="text-transform: capitalize;">${room.status}</small></div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
}

function updateRoomStatus(roomNumbers, status) {
    roomNumbers.forEach(roomNum => {
        for (let floor in rooms) {
            const room = rooms[floor].find(r => r.number === roomNum);
            if (room) {
                room.status = status;
            }
        }
    });
    initializeRooms();
}

function showSection(sectionId, event) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (sectionId === 'attendanceCalendar') {
        renderAttendanceCalendar();
    }
    
    if (sectionId === 'food' && !currentBookingForFood) {
        const addFoodBtn = document.querySelector('#food .btn-success');
        if (addFoodBtn) {
            addFoodBtn.textContent = 'Create Food Order (Walk-in)';
            addFoodBtn.onclick = createFoodOrder;
        }
    }
}

console.log('✅ Dashboard Part 3 (Init) loaded');
// ==================== BOOKING SUBMISSION ====================

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    if (selectedRooms.length === 0) {
        alert('Please select at least one room!');
        return false;
    }

    const checkInDate = document.getElementById('checkInDate')?.value;
    const checkOutDate = document.getElementById('checkOutDate')?.value;
    
    if (!checkOutDate) {
        alert('Please select check-out date');
        return false;
    }

    const manualNights = parseInt(document.getElementById('numNights')?.value || 1);
    const roomAmountPerNight = parseInt(document.getElementById('roomAmount')?.value || 0);
    
    const totalRoomAmount = roomAmountPerNight * manualNights;
    
    const additionalAmount = parseInt(document.getElementById('additionalAmount')?.value || 0);
    const advancePayment = parseInt(document.getElementById('advancePayment')?.value || 0);
    const customerName = document.getElementById('cust1')?.value;
    const mobile = document.getElementById('mobile1')?.value||''
        const grandTotal = totalRoomAmount + additionalAmount
    const balance = grandTotal - advancePayment;
    console.log('customer name',customerName)
    console.log('mobile',mobile)
    
    console.log('💰 Booking Calculation:');
    console.log(`  Nights: ${manualNights}`);
    console.log(`  Room Amount Per Night: ₹${roomAmountPerNight}`);
    console.log(`  Total Room Amount (${roomAmountPerNight} × ${manualNights}): ₹${totalRoomAmount}`);
    console.log(`  Additional Amount: ₹${additionalAmount}`);
    console.log(`  Grand Total: ₹${grandTotal}`);
    console.log(`  Advance: ₹${advancePayment}`);
    console.log(`  Balance: ₹${balance}`);
    
    const customerId = 'CUST' + String(customers.length + 1).padStart(4, '0');
    const bookingId = 'BK' + String(bookingCounter).padStart(4, '0');
    
    try {
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = '⏳ Creating booking...';
        submitBtn.disabled = true;
        
        const uploadedDocs = await uploadDocuments(customerId, bookingId);
        
        const bookingData = {
            'Booking ID': bookingId,
            'Customer Name': document.getElementById('cust1')?.value || '',
            'Mobile': document.getElementById('mobile1')?.value || '',
            'Address': document.getElementById('address')?.value,
            'Sr Number': document.getElementById('srNumber')?.value || 'N/A',
            'No. of Persons': document.getElementById('numPersons')?.value,
            'Room Number': selectedRooms.map(r => r.number).join(', '),
            'Room Type': selectedRooms.map(r => r.type).join(', '),
            'Check In': checkInDate,
            'Check In Time': document.getElementById('checkInTime')?.value,
            'Check Out': checkOutDate,
            'Nights': manualNights,
            'Room Price Per Night': roomAmountPerNight,
            'Room Amount': totalRoomAmount,
            'Additional Amount': additionalAmount,
            'Total Amount': grandTotal,
            'Payment Mode': document.getElementById('paymentMode')?.value,
            'Advance': advancePayment,
            'Balance': balance,
            'Status': 'Confirmed',
            'Date': new Date().toLocaleDateString('en-GB'),
            'Time': new Date().toLocaleTimeString(),
            'Note': document.getElementById('note')?.value || '',
            'Food Orders': []
        };
        
        console.log()
        console.log('📤 Sending booking to server:', bookingData);
        
        const mongoBookingData = {
    bookingId: bookingId,
    customerName: document.getElementById('cust1')?.value || '',
    mobile: document.getElementById('mobile1')?.value || '',
    address: document.getElementById('address')?.value || '',
    srNumber: document.getElementById('srNumber')?.value || 'N/A',
    numPersons: document.getElementById('numPersons')?.value || 1,

    rooms: selectedRooms.map(r => ({
        number: r.number,
        type: r.type
    })),

    checkInDate: checkInDate,
    checkInTime: document.getElementById('checkInTime')?.value,
    checkOutDate: checkOutDate,
    nights: manualNights,

    roomPricePerNight: roomAmountPerNight,
    roomAmount: totalRoomAmount,
    additionalAmount: additionalAmount,
    totalAmount: grandTotal,

    paymentMode: document.getElementById('paymentMode')?.value,
    advance: advancePayment,
    balance: balance,

    status: 'Confirmed',
    note: document.getElementById('note')?.value || '',
    foodOrders: [],
    documents: uploadedDocs || []
};

console.log('📤 Sending MongoDB booking:', mongoBookingData);

const response = await fetch(`${API_URL}/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mongoBookingData)
});
        
        const result = await response.json();
        console.log('📥 Server response:', result);
        
        if (!result.success) {
            throw new Error(result.error || 'Failed to create booking');
        }
        
        await fetch(`${API_URL}/customers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'Customer ID': customerId,
                'Name': customerName,
                'Mobile': mobile,
                'Address': bookingData['Address'],
                'Total Bookings': 1,
                'documents': uploadedDocs || []
            })
        });
        
        await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                'Payment ID': 'PAY' + String(payments.length + 1).padStart(4, '0'),
                'Booking ID': bookingId,
                'Customer Name': customerName,
                'Amount': advancePayment,
                'Payment Mode': bookingData['Payment Mode'],
                'Date': bookingData['Date'],
                'Time': bookingData['Time']
            })
        });
        
        bookingCounter++;
        
        const docsMessage = uploadedDocs && uploadedDocs.length > 0 
            ? `\n📄 ${uploadedDocs.length} document(s) ready for Google Drive` 
            : '';
        
        alert(
            `✅ Booking created successfully!${docsMessage}\n\n` +
            `📋 Booking ID: ${bookingId}\n` +
            `👤 Customer: ${customerName}\n` +
            `🏠 Rooms: ${bookingData['Room Number']}\n` +
            `🌙 Nights: ${manualNights}\n` +
            `💵 Rate: ₹${roomAmountPerNight}/night\n` +
            `🏨 Room Total: ₹${totalRoomAmount}\n` +
            `➕ Additional: ₹${additionalAmount}\n` +
            `💰 Grand Total: ₹${grandTotal}\n` +
            `✅ Advance Paid: ₹${advancePayment}\n` +
            `⚠️ Balance: ₹${balance}`
        );
        
        printInvoice(bookingId);
        
        e.target.reset();
        
        ['file1Name', 'file2Name', 'file3Name', 'file4Name'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.textContent = '';
        });
        
        selectedRooms = [];
        document.querySelectorAll('.room-box').forEach(box => box.classList.remove('selected'));
        updateSelectedRoomsList();
        
        await loadAllData();
        
        submitBtn.textContent = '✅ Create Booking & Generate Invoice';
        submitBtn.disabled = false;
        
    } catch (error) {
        console.error('❌ Booking error:', error);
        alert('❌ Failed to create booking: ' + error.message);
        
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.textContent = '✅ Create Booking & Generate Invoice';
        submitBtn.disabled = false;
    }
    
    return false;
}

// ==================== ADVANCE BOOKING ====================

async function handleAdvanceBookingSubmit(e) {
  e.preventDefault();

  const customerName = document.getElementById("advCustomerName")?.value?.trim() || "";
  const mobile = document.getElementById("advMobileNumber")?.value?.trim() || "";
  const checkInDate = document.getElementById("advCheckInDate")?.value || "";
  const checkOutDate = document.getElementById("advCheckOutDate")?.value || "";
  const numPersons = Number(document.getElementById("advNumPersons")?.value || 1);
  const checkInTime = document.getElementById("advCheckInTime")?.value || "";
  const totalAmount = Number(document.getElementById("advTotalAmount")?.value || 0);
  const advanceAmount = Number(document.getElementById("advAdvanceAmount")?.value || 0);
  const note = document.getElementById("advNote")?.value || "";

  if (!customerName || !mobile || !checkInDate || !checkOutDate) {
    alert("❌ Please fill Customer Name, Mobile, Check-in and Check-out.");
    return false;
  }

  const bookingId = "BK" + String(bookingCounter).padStart(4, "0");
  const customerId = "CUST" + String(customers.length + 1).padStart(4, "0");

  const mongoAdvanceBookingData = {
    bookingId,
    customerName,
    mobile,
    address: "",                 // optional
    srNumber: "N/A",             // optional
    numPersons,

    rooms: [],                   // ✅ no rooms yet (TBD)
    checkInDate,
    checkInTime,
    checkOutDate,
    nights: 1,                   // optional, you can calculate later

    roomPricePerNight: 0,
    roomAmount: 0,
    additionalAmount: 0,

    totalAmount,
    paymentMode: "cash",
    advance: advanceAmount,
    balance: totalAmount - advanceAmount,

    status: "Advance Booking",   // ✅ main change
    note,
    foodOrders: [],
    documents: []
  };

  try {
    const response = await fetch(`${API_URL}/bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mongoAdvanceBookingData)
    });

    const result = await response.json();

    // if your backend returns {success:true, booking:...}
    if (!response.ok || result.success === false) {
      throw new Error(result.error || "Failed to create advance booking");
    }

    // OPTIONAL: create customer in mongodb too
    await fetch(`${API_URL}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId,
        name: customerName,
        mobile,
        address: "",
        totalBookings: 1,
        documents: []
      })
    });

    // OPTIONAL: create payment in mongodb too
    await fetch(`${API_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentId: "PAY" + String(payments.length + 1).padStart(4, "0"),
        bookingId,
        customerName,
        amount: advanceAmount,
        paymentMode: "cash",
        date: new Date().toLocaleDateString("en-GB"),
        time: new Date().toLocaleTimeString()
      })
    });

    bookingCounter++;

    alert(
      `✅ Advance Booking created!\n\n📋 Booking ID: ${bookingId}\nRoom will be allocated on check-in.`
    );

    e.target.reset();
    await loadAllData();

  } catch (error) {
    console.error("❌ Advance booking error:", error);
    alert("❌ Failed to create advance booking: " + error.message);
  }

  return false;
}

// ==================== DASHBOARD UPDATES ====================

function updateDashboard() {
    const totalRooms = rooms.first.length + rooms.second.length + rooms.third.length;
    document.getElementById('totalRooms').textContent = totalRooms;
    
    const confirmedBookings = bookings.filter(b => b.status === 'Confirmed').length;
    document.getElementById('bookingCount').textContent = confirmedBookings;
    
    let availableCount = Object.values(rooms).reduce((sum, floor) => 
        sum + floor.filter(r => r.status === 'available').length, 0
    );
    document.getElementById('availableCount').textContent = availableCount;
    
    const today = new Date().toISOString().slice(0, 10);

let totalRevenue = bookings
  .filter(b =>
    b.checkInDate === today &&
    (b.status === 'Confirmed' || b.status === 'Checked Out')
  )
  .reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

document.getElementById('revenueToday').textContent = '₹' + totalRevenue;


    
    let pendingAmount = bookings
        .filter(b => b.status === 'Confirmed' || b.status === 'Checked Out')
        .reduce((sum, b) => sum + (parseInt(b.Balance) || 0), 0);
    document.getElementById('pendingAmount').textContent = '₹' + pendingAmount;
    
    let advanceBookings = bookings.filter(b => b.status === 'Advance Booking').length;
    document.getElementById('advanceBookings').textContent = advanceBookings;
    
    const recentTable = document.getElementById('recentBookingsTable');
    if (recentTable && bookings.length > 0) {
        const recentBookings = bookings.filter(b => b.status === 'Confirmed').slice(-5).reverse();
        if (recentBookings.length > 0) {
            recentTable.innerHTML = `<table><thead><tr><th>Booking ID</th><th>Customer</th><th>Room</th><th>Check-in</th><th>Nights</th><th>Total</th><th>Status</th></tr></thead><tbody>
                ${recentBookings.map(b => {
                    //var number = 
                    console.log('recentBookings',recentBookings)
                    const nights = b.Nights || calculateNights(b['Check In'], b['Check Out']);
                return `<tr><td>${b['Booking ID']}</td><td>${b['customerName']}</td><td>${b.rooms.map(i => i.number).join(', ')}</td><td>${b['checkInDate']}</td><td>${nights}</td><td>₹${b['Total Amount']}</td><td><span class="badge badge-success">${b.status}</span></td></tr>`;
                }).join('')}</tbody></table>`;
        } else {
            recentTable.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px;">No confirmed bookings yet</p>';
        }
    }
}

// ==================== FOOD MENU FUNCTIONS ====================

function searchFoodMenu() {
    const searchInput = document.getElementById('foodSearch');
    if (!searchInput) return;
    const searchTerm = searchInput.value.toLowerCase().trim();
    filteredFoodItems = !searchTerm ? [...foodItems] : foodItems.filter(item => item.name.toLowerCase().includes(searchTerm));
    initializeFoodMenu();
}

function initializeFoodMenu() {
    const foodMenu = document.getElementById('foodMenu');
    if (!foodMenu) return;
    foodMenu.innerHTML = '';
    if (filteredFoodItems.length === 0) {
        foodMenu.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 30px; grid-column: 1/-1;">No items found</p>';
        return;
    }
    filteredFoodItems.forEach(item => {
        const div = document.createElement('div');
        div.className = 'food-item';
        div.innerHTML = `<h4>${item.name}</h4><div class="price">₹${item.price}</div>
            <div class="quantity-control">
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, -1)">-</button>
                <span class="quantity-display" id="qty-${item.id}">${foodOrder[item.id] || 0}</span>
                <button type="button" class="quantity-btn" onclick="updateFoodQty(${item.id}, 1)">+</button>
            </div>`;
        foodMenu.appendChild(div);
    });
}

function updateFoodQty(itemId, change) {
    if (!foodOrder[itemId]) foodOrder[itemId] = 0;
    foodOrder[itemId] = Math.max(0, foodOrder[itemId] + change);
    const qtyEl = document.getElementById(`qty-${itemId}`);
    if (qtyEl) qtyEl.textContent = foodOrder[itemId];
    updateFoodTotal();
}

function updateFoodTotal() {
    let total = 0;
    for (let itemId in foodOrder) {
        const item = foodItems.find(i => i.id == itemId);
        if (item && item.price) total += item.price * foodOrder[itemId];
    }
    const totalEl = document.getElementById('foodTotal');
    if (totalEl) totalEl.textContent = total;
}

function createFoodOrder() {
    let hasItems = false, orderItems = [], totalAmount = 0;
    for (let id in foodOrder) {
        if (foodOrder[id] > 0) {
            hasItems = true;
            const item = foodItems.find(i => i.id == id);
            if (item && item.price) {
                orderItems.push({ name: item.name, quantity: foodOrder[id], price: item.price, total: item.price * foodOrder[id] });
                totalAmount += item.price * foodOrder[id];
            }
        }
    }
    if (!hasItems) { alert('Please select at least one food item'); return; }
    const foodInvoice = {
        type: 'Food Order',
        id: 'FOOD' + String(Date.now()).slice(-6),
        items: orderItems,
        totalAmount: totalAmount,
        date: new Date().toLocaleDateString('en-GB'),
        time: new Date().toLocaleTimeString()
    };
    printFoodInvoice(foodInvoice);
    alert('✅ Food order invoice generated!');
    foodOrder = {};
    filteredFoodItems = [...foodItems];
    const searchInput = document.getElementById('foodSearch');
    if (searchInput) searchInput.value = '';
    initializeFoodMenu();
    updateFoodTotal();
}

// ==================== FOOD MENU MANAGER ====================

function renderFoodMenuManager() {
    const container = document.getElementById('foodMenuManager');
    if (!container) return;
    
    let html = `
        <div style="margin-bottom: 20px;">
            <button class="btn btn-success" onclick="openAddFoodItemModal()">+ Add New Item</button>
        </div>
        <div style="overflow-x: auto;">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Item Name</th>
                        <th>Price</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>`;
    
    foodItems.forEach(item => {
        html += `
            <tr>
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>₹${item.price}</td>
                <td>
                    <button class="action-btn btn-warning" onclick="editFoodItem(${item.id})">✏️ Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteFoodItem(${item.id})">🗑️ Delete</button>
                </td>
            </tr>`;
    });
    
    html += `</tbody></table></div>`;
    
    html += `
        <div id="foodItemModal" class="modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="foodModalTitle">Add Food Item</h2>
                    <span class="close-btn" onclick="closeFoodItemModal()">×</span>
                </div>
                <form id="foodItemForm" onsubmit="return handleFoodItemSubmit(event)">
                    <input type="hidden" id="foodItemId">
                    
                    <div class="form-group">
                        <label>Item Name *</label>
                        <input type="text" id="foodItemName" required>
                    </div>
                    
                    <div class="form-group">
                        <label>Price *</label>
                        <input type="number" id="foodItemPrice" required min="1">
                    </div>
                    
                    <div style="margin-top: 20px;">
                        <button type="submit" class="btn btn-success">✅ Save Item</button>
                        <button type="button" class="btn btn-danger" onclick="closeFoodItemModal()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>`;
    
    container.innerHTML = html;
}

function openAddFoodItemModal() {
    document.getElementById('foodModalTitle').textContent = 'Add Food Item';
    document.getElementById('foodItemForm').reset();
    document.getElementById('foodItemId').value = '';
    currentEditingFoodItem = null;
    document.getElementById('foodItemModal').classList.add('active');
}

function editFoodItem(itemId) {
    const item = foodItems.find(i => i.id === itemId);
    if (!item) return;
    
    document.getElementById('foodModalTitle').textContent = 'Edit Food Item';
    document.getElementById('foodItemId').value = item.id;
    document.getElementById('foodItemName').value = item.name;
    document.getElementById('foodItemPrice').value = item.price;
    currentEditingFoodItem = item;
    document.getElementById('foodItemModal').classList.add('active');
}

function deleteFoodItem(itemId) {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    const index = foodItems.findIndex(i => i.id === itemId);
    if (index !== -1) {
        foodItems.splice(index, 1);
        saveFoodItems();
        renderFoodMenuManager();
        initializeFoodMenu();
        alert('✅ Food item deleted successfully!');
    }
}

function handleFoodItemSubmit(e) {
    e.preventDefault();
    
    const itemId = document.getElementById('foodItemId').value;
    const itemName = document.getElementById('foodItemName').value;
    const itemPrice = parseInt(document.getElementById('foodItemPrice').value);
    
    if (itemId) {
        const item = foodItems.find(i => i.id == itemId);
        if (item) {
            item.name = itemName;
            item.price = itemPrice;
            alert('✅ Food item updated successfully!');
        }
    } else {
        const newId = foodItems.length > 0 ? Math.max(...foodItems.map(i => i.id)) + 1 : 1;
        foodItems.push({
            id: newId,
            name: itemName,
            price: itemPrice
        });
        alert('✅ Food item added successfully!');
    }
    
    saveFoodItems();
    filteredFoodItems = [...foodItems];
    renderFoodMenuManager();
    initializeFoodMenu();
    closeFoodItemModal();
    
    return false;
}

function closeFoodItemModal() {
    document.getElementById('foodItemModal').classList.remove('active');
}

function openFoodMenuForBooking(bookingId) {
    currentBookingForFood = bookingId;
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    
    if (!booking) {
        alert('Booking not found');
        return;
    }
    
    foodOrder = {};
    filteredFoodItems = [...foodItems];
    initializeFoodMenu();
    updateFoodTotal();
    
    showSection('food');
    
    const addFoodBtn = document.querySelector('#food .btn-success');
    if (addFoodBtn) {
        addFoodBtn.textContent = `Add Food to Booking ${bookingId}`;
        addFoodBtn.onclick = async function() {
            let hasItems = false, orderItems = [], totalAmount = 0;
            for (let id in foodOrder) {
                if (foodOrder[id] > 0) {
                    hasItems = true;
                    const item = foodItems.find(i => i.id == id);
                    if (item && item.price) {
                        orderItems.push({ 
                            name: item.name, 
                            quantity: foodOrder[id], 
                            price: item.price, 
                            total: item.price * foodOrder[id] 
                        });
                        totalAmount += item.price * foodOrder[id];
                    }
                }
            }
            
            if (!hasItems) {
                alert('Please select at least one food item');
                return;
            }
            
            try {
                const response = await fetch(`${API_URL}/bookings/${bookingId}/add-food`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        foodItems: orderItems,
                        foodTotal: totalAmount
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`✅ Food order added!\n\nTotal: ₹${totalAmount}\n\nThis amount has been added to the booking.`);
                    foodOrder = {};
                    currentBookingForFood = null;
                    await loadAllData();
                    showSection('bookings');
                } else {
                    alert('❌ Failed to add food order');
                }
            } catch (error) {
                console.error('Error adding food:', error);
                alert('❌ Error adding food order');
            }
        };
    }
}

function showSection(sectionId, event) {
    document.querySelectorAll('.content-section').forEach(section => section.classList.remove('active'));
    const el = document.getElementById(sectionId);
    if (el) el.classList.add('active');
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
    const sidebar = document.querySelector('.sidebar');
    if (sidebar && sidebar.classList.contains('mobile-open')) {
        sidebar.classList.remove('mobile-open');
    }
    if (sectionId === 'attendanceCalendar') {
        renderAttendanceCalendar();
    }
    
    if (sectionId === 'food' && !currentBookingForFood) {
        const addFoodBtn = document.querySelector('#food .btn-success');
        if (addFoodBtn) {
            addFoodBtn.textContent = 'Create Food Order (Walk-in)';
            addFoodBtn.onclick = createFoodOrder;
        }
    }
}
// ==================== TABLE UPDATES ====================

function updateAllTables() {
    // Update all bookings table
    const allBookingsTable = document.getElementById('allBookingsTable');
    if (allBookingsTable) {
  const confirmedBookings = bookings.filter(b =>
    b.status === "Confirmed" || b.status === "Checked Out" || b.status === "Cancelled"
  );

  if (confirmedBookings.length > 0) {
    allBookingsTable.innerHTML = confirmedBookings.map((b) => {
      const bookingId = b.bookingId || "";
      const nights = Number(b.nights || 1);

      const roomPricePerNight = Number(b.roomPricePerNight || 0);
      const roomAmount = Number(b.roomAmount || (roomPricePerNight * nights) || 0);

      const additionalAmount = Number(b.additionalAmount || 0);
      const totalAmount = Number(b.totalAmount || (roomAmount + additionalAmount) || 0);

      // ✅ payments based on bookingId
      const bookingPayments = payments.filter(p => p.bookingId === bookingId);
      const totalPaid = bookingPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const currentBalance = totalAmount - totalPaid;
      const hasBalance = currentBalance > 0;
      const isConfirmed = b.status === "Confirmed";

      const roomNumbers = Array.isArray(b.rooms) ? b.rooms.map(r => r.number).join(", ") : "TBD";
      const roomTypes = Array.isArray(b.rooms) ? b.rooms.map(r => r.type || "N/A").join(", ") : "N/A";

      return `<tr>
        <td>${bookingId}</td>
        <td>
          ${b.customerName || ""}
          <br><small style="color:#7f8c8d;">${b.mobile || ""}</small>
        </td>

        <td>${roomNumbers}<br><small style="color:#7f8c8d;">${roomTypes}</small></td>

        <td>${b.checkInDate || ""}<br><small style="color:#27ae60;">${b.checkInTime || "N/A"}</small></td>

        <td>${b.checkOutDate || "Not set"}</td>

        <td>${nights} ${nights === 1 ? "night" : "nights"}</td>

        <td>₹${roomPricePerNight}/night<br><small style="color:#7f8c8d;">Total: ₹${roomAmount}</small></td>

        <td>₹${totalAmount}</td>

        <td>
          <span class="badge badge-${
            b.status === "Cancelled" ? "danger" :
            b.status === "Checked Out" ? "info" : "success"
          }">${b.status}</span>
          ${hasBalance ? `<br><span class="badge badge-warning" style="margin-top:5px;">Balance: ₹${currentBalance}</span>` : ""}
        </td>

        <td>
          <div class="action-buttons">
            ${isConfirmed ? `
              <button class="action-btn btn-primary" onclick="openFoodMenuForBooking('${bookingId}')">🍽️ Food</button>
              <button class="action-btn btn-warning" onclick="openEditBookingModal('${bookingId}')">✏️ Edit</button>
            ` : ""}

            ${hasBalance ? `
              <button class="action-btn btn-info" onclick="openPaymentModal('${bookingId}')"
                style="background:#f39c12;border:2px solid #e67e22;font-weight:bold;">
                💰 Payment
              </button>
            ` : ""}

            ${isConfirmed ? `
              <button class="action-btn btn-danger" onclick="checkoutBooking('${bookingId}')">📤 Checkout</button>
            ` : ""}

            <button class="action-btn btn-success" onclick="printInvoice('${bookingId}')">🖨️ Print</button>
            <button class="action-btn btn-whatsapp" onclick="shareWhatsApp('${bookingId}')">📱 Share</button>
            <button class="action-btn btn-danger" onclick="deleteBooking('${bookingId}')">🗑️ Delete</button>
          </div>
        </td>
      </tr>`;
    }).join("");
  } else {
    allBookingsTable.innerHTML =
      '<tr><td colspan="10" style="text-align:center;color:#7f8c8d;">No confirmed bookings yet</td></tr>';
  }
}

    
    updateCustomersTableWithDocs();

    const paymentsTable = document.getElementById('paymentsTable');
    if (paymentsTable) {
        if (payments.length > 0) {
            paymentsTable.innerHTML = payments.map(p => `
                <tr>
                    <td>${p['Payment ID']}</td>
                    <td>${p['Booking ID']}</td>
                    <td>${p['Customer Name']}</td>
                    <td>₹${p.Amount}</td>
                    <td>${p['Payment Mode']}</td>
                    <td>${p.Date}</td>
                    <td><span class="badge badge-success">Completed</span></td>
                    <td>
                        <button class="action-btn btn-danger" onclick="deletePayment('${p['Payment ID']}')">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            paymentsTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">No payments yet</td></tr>';
        }
    }
    
    const advanceBookingsTable = document.getElementById('advanceBookingsTable');
    if (advanceBookingsTable) {
        const advBookings = bookings.filter(b => b.status === 'Advance Booking');
        if (advBookings.length > 0) {
            advanceBookingsTable.innerHTML = advBookings.map(b => `
                <tr>
                    <td>${b['bookingId']}</td>
                    <td>${b['customerName']}</td>
                    <td>${b['mobile']}</td>
                    <td>${b['checkInDate']}</td>
                    <td>${b['checkOutDate']}</td>
                    <td> - </td>
                    <td>₹${b['totalAmount']}</td>
                    <td>₹${b['Advance']}</td>
                    <td><span class="badge badge-warning">Advance</span></td>
                    <td>
                        <button class="action-btn btn-danger" onclick="deleteBooking('${b['bookingId']}')">
                            🗑️ Delete
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            advanceBookingsTable.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #7f8c8d;">No advance bookings yet</td></tr>';
        }
    }
}

function updateCustomersTableWithDocs() {
    const customersTable = document.getElementById('customersTable');
    if (customersTable) {
        if (customers.length > 0) {
            customersTable.innerHTML = customers.map(c => {
                const docCount = c.documents ? c.documents.length : 0;
                return `
                    <tr>
                        <td>${c['Customer ID']}</td>
                        <td>${c.Name}</td>
                        <td>${c.Mobile}</td>
                        <td>${c.Address}</td>
                        <td>${c['Total Bookings']}</td>
                        <td>
                            ${docCount > 0 ? `
                                <button class="btn btn-info" onclick="viewCustomerDocuments('${c['Customer ID']}')" 
                                        style="background: #3498db; padding: 8px 12px;">
                                    📁 View (${docCount})
                                </button>
                            ` : `
                                <span style="color: #95a5a6;">No documents</span>
                            `}
                        </td>
                        <td>
                            <button class="action-btn btn-danger" onclick="deleteCustomer('${c['Customer ID']}')">
                                🗑️ Delete
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            customersTable.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #7f8c8d;">No customers yet</td></tr>';
        }
    }
}

// ==================== EDIT BOOKING ====================

function openEditBookingModal(bookingId) {
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    if (!booking) return;
    
    document.getElementById('editBookingId').value = booking['Booking ID'];
    document.getElementById('editCustomerName').value = booking['Customer Name'];
    document.getElementById('editMobileNumber').value = booking['Mobile'];
    document.getElementById('editCheckInDate').value = booking['Check In'];
    document.getElementById('editCheckOutDate').value = booking['Check Out'];
    document.getElementById('editNights').value = booking.Nights || 1;
    document.getElementById('editRoomAmountPerNight').value = booking['Room Price Per Night'] || 0;
    document.getElementById('editAdditionalAmount').value = booking['Additional Amount'] || 0;
    document.getElementById('editNote').value = booking['Note'] || '';
    
    document.getElementById('editBookingModal').classList.add('active');
}

function closeEditBookingModal() {
    document.getElementById('editBookingModal').classList.remove('active');
}

async function handleEditBookingSubmit(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('editBookingId').value;
    const nights = parseInt(document.getElementById('editNights').value);
    const roomPricePerNight = parseInt(document.getElementById('editRoomAmountPerNight').value);
    const additionalAmount = parseInt(document.getElementById('editAdditionalAmount').value || 0);
    
    const roomAmount = roomPricePerNight * nights;
    const totalAmount = roomAmount + additionalAmount;
    
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    const advance = booking ? booking['Advance'] : 0;
    const balance = totalAmount - advance;
    
    const updatedBooking = {
        ...booking,
        'Customer Name': document.getElementById('editCustomerName').value,
        'Mobile': document.getElementById('editMobileNumber').value,
        'Check In': document.getElementById('editCheckInDate').value,
        'Check Out': document.getElementById('editCheckOutDate').value,
        'Nights': nights,
        'Room Price Per Night': roomPricePerNight,
        'Room Amount': roomAmount,
        'Additional Amount': additionalAmount,
        'Total Amount': totalAmount,
        'Balance': balance,
        'Note': document.getElementById('editNote').value
    };
    
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updatedBooking)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('✅ Booking updated successfully!');
            closeEditBookingModal();
            await loadAllData();
        } else {
            alert('❌ Failed to update booking');
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('❌ Error updating booking');
    }
    
    return false;
}

// ==================== PAYMENT MODAL ====================

function openPaymentModal(bookingId) {
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    if (!booking) return;
    
    // ✅ FIX: Calculate correct balance from all payments
    const bookingPayments = payments.filter(p => p['Booking ID'] === bookingId);
    const totalPaid = bookingPayments.reduce((sum, p) => sum + parseInt(p.Amount || 0), 0);
    const totalAmount = parseInt(booking['Total Amount']) || 0;
    const currentBalance = totalAmount - totalPaid;
    
    document.getElementById('paymentBookingId').value = booking['Booking ID'];
    document.getElementById('paymentCustomerName').textContent = booking['Customer Name'];
    document.getElementById('paymentRoomNumber').textContent = booking['Room Number'];
    document.getElementById('paymentBalance').textContent = currentBalance;
    
    document.getElementById('paymentModal').classList.add('active');
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('active');
    document.getElementById('paymentForm').reset();
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    
    const bookingId = document.getElementById('paymentBookingId').value;
    const paymentAmount = parseInt(document.getElementById('paymentAmount').value);
    const paymentMethod = document.getElementById('paymentMethod').value;
    const paymentNote = document.getElementById('paymentNote').value;
    
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    
    if (!booking) {
        alert('Booking not found');
        return false;
    }
    
    if (paymentAmount > booking['Balance']) {
        alert('⚠️ Payment amount cannot exceed balance due!');
        return false;
    }
    
    try {
        const paymentData = {
            'Payment ID': 'PAY' + String(payments.length + 1).padStart(4, '0'),
            'Booking ID': bookingId,
            'Customer Name': booking['Customer Name'],
            'Amount': paymentAmount,
            'Payment Mode': paymentMethod,
            'Date': new Date().toLocaleDateString('en-GB'),
            'Time': new Date().toLocaleTimeString(),
            'Note': paymentNote,
            'Type': 'Partial Payment'
        };
        
        const response = await fetch(`${API_URL}/payments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(paymentData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const newBalance = booking['Balance'] - paymentAmount;
            alert(
                `✅ Payment recorded successfully!\n\n` +
                `💰 Amount Paid: ₹${paymentAmount}\n` +
                `📊 New Balance: ₹${newBalance}`
            );
            
            closePaymentModal();
            await loadAllData();
        } else {
            alert('❌ Failed to record payment');
        }
    } catch (error) {
        console.error('Error recording payment:', error);
        alert('❌ Error recording payment');
    }
    
    return false;
}
// ==================== DELETE FUNCTIONS ====================

async function deleteBooking(bookingId) {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Booking deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete booking');
    }
}

async function deleteCustomer(customerId) {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    try {
        const response = await fetch(`${API_URL}/customers/${customerId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Customer deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete customer');
    }
}

async function deletePayment(paymentId) {
    if (!confirm('Are you sure you want to delete this payment?')) return;
    try {
        const response = await fetch(`${API_URL}/payments/${paymentId}`, { method: 'DELETE' });
        if (response.ok) {
            alert('✅ Payment deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to delete payment');
    }
}

// ==================== CHECKOUT ====================

async function checkoutBooking(bookingId) {
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    if (!booking) return;
    
    const confirmMsg = booking['Balance'] > 0 
        ? `Checkout booking ${bookingId}?\n\n⚠️ Pending Balance: ₹${booking['Balance']}\nPayment can be collected later.`
        : `Checkout booking ${bookingId}?`;
    
    if (!confirm(confirmMsg)) return;
    
    try {
        const response = await fetch(`${API_URL}/bookings/${bookingId}/checkout`, { method: 'POST' });
        
        if (response.ok) {
            const result = await response.json();
            
            if (booking['Balance'] > 0) {
                alert(
                    `✅ Checkout completed!\n\n` +
                    `🕐 Check-out Time: ${result.checkoutTime}\n` +
                    `⚠️ Pending Balance: ₹${booking['Balance']}\n\n` +
                    `💡 Use "💰 Payment" button to collect remaining amount.`
                );
            } else {
                alert(`✅ Checkout completed!\n\n🕐 Check-out Time: ${result.checkoutTime}\n✅ Fully paid.`);
            }
            
            await loadAllData();
        }
    } catch (error) {
        alert('❌ Failed to checkout');
    }
}

// ==================== STAFF MANAGEMENT ====================

function updateStaffTable() {
    const staffTable = document.getElementById('staffTable');
    if (!staffTable) return;
    
    if (staff.length === 0) {
        staffTable.innerHTML = '<tr><td colspan="8" style="text-align: center; color: #7f8c8d;">No staff members yet.</td></tr>';
        return;
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    staffTable.innerHTML = staff.map(s => {
        const todayAttendance = attendance.find(a => 
            a['Staff ID'] === s['Staff ID'] && 
            a.Date.includes(today)
        );
        
        const attendanceStatus = todayAttendance 
            ? `<span class="badge badge-${todayAttendance.Status === 'Present' ? 'success' : 'danger'}">${todayAttendance.Status}</span>`
            : '<span class="badge" style="background: #95a5a6; color: white;">Not Marked</span>';
        
        return `
            <tr>
                <td>${s['Staff ID']}</td>
                <td>${s.Name}</td>
                <td>${s.Mobile}</td>
                <td>${s.Position}</td>
                <td>₹${s.Salary}</td>
                <td>${s['Join Date']}</td>
                <td>
                    ${attendanceStatus}
                    ${!todayAttendance ? `
                        <div style="margin-top: 5px;">
                            <button class="action-btn btn-success" onclick="markAttendance('${s['Staff ID']}', 'Present')" 
                                    style="padding: 4px 8px; font-size: 10px;">P</button>
                            <button class="action-btn btn-danger" onclick="markAttendance('${s['Staff ID']}', 'Absent')" 
                                    style="padding: 4px 8px; font-size: 10px;">A</button>
                        </div>
                    ` : ''}
                </td>
                <td>
                    <button class="action-btn btn-warning" onclick="openEditStaffModal('${s['Staff ID']}')">✏️ Edit</button>
                    <button class="action-btn btn-danger" onclick="deleteStaff('${s['Staff ID']}')">🗑️ Delete</button>
                </td>
            </tr>
        `;
    }).join('');
    
    const attendanceTable = document.getElementById('attendanceTable');
    if (attendanceTable) {
        if (attendance.length === 0) {
            attendanceTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No attendance records yet</td></tr>';
        } else {
            const sortedAttendance = [...attendance].sort((a, b) => {
                const dateA = new Date(a.Date.split('/').reverse().join('-'));
                const dateB = new Date(b.Date.split('/').reverse().join('-'));
                return dateB - dateA;
            });
            
            attendanceTable.innerHTML = sortedAttendance.map(a => `
                <tr>
                    <td>${a['Attendance ID']}</td>
                    <td>${a['Staff ID']}</td>
                    <td>${a['Staff Name']}</td>
                    <td>${a.Date}</td>
                    <td>${a.Time}</td>
                    <td><span class="badge badge-${a.Status === 'Present' ? 'success' : 'danger'}">${a.Status}</span></td>
                </tr>
            `).join('');
        }
    }
}

function openAddStaffModal() {
    document.getElementById('staffModalTitle').textContent = 'Add New Staff';
    document.getElementById('staffForm').reset();
    document.getElementById('staffId').value = '';
    document.getElementById('staffModal').classList.add('active');
}

function openEditStaffModal(staffId) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    document.getElementById('staffModalTitle').textContent = 'Edit Staff';
    document.getElementById('staffId').value = staffMember['Staff ID'];
    document.getElementById('staffName').value = staffMember.Name;
    document.getElementById('staffMobile').value = staffMember.Mobile;
    document.getElementById('staffPosition').value = staffMember.Position;
    document.getElementById('staffSalary').value = staffMember.Salary;
    document.getElementById('staffJoinDate').value = staffMember['Join Date'];
    
    document.getElementById('staffModal').classList.add('active');
}

function closeStaffModal() {
    document.getElementById('staffModal').classList.remove('active');
}

async function handleStaffSubmit(e) {
    e.preventDefault();
    
    const staffId = document.getElementById('staffId').value;
    const staffData = {
        'Staff ID': staffId || 'STAFF' + String(staff.length + 1).padStart(4, '0'),
        'Name': document.getElementById('staffName').value,
        'Mobile': document.getElementById('staffMobile').value,
        'Position': document.getElementById('staffPosition').value,
        'Salary': parseInt(document.getElementById('staffSalary').value),
        'Join Date': document.getElementById('staffJoinDate').value
    };
    
    try {
        let response;
        if (staffId) {
            response = await fetch(`${API_URL}/staff/${staffId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staffData)
            });
        } else {
            response = await fetch(`${API_URL}/staff`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(staffData)
            });
        }
        
        const result = await response.json();
        
        if (result.success) {
            alert(staffId ? '✅ Staff updated successfully!' : '✅ Staff added successfully!');
            closeStaffModal();
            await loadAllData();
        } else {
            alert('❌ Failed to save staff');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        alert('❌ Error saving staff');
    }
    
    return false;
}

async function deleteStaff(staffId) {
    if (!confirm('Are you sure you want to delete this staff member?')) return;
    
    try {
        const response = await fetch(`${API_URL}/staff/${staffId}`, { method: 'DELETE' });
        
        if (response.ok) {
            alert('✅ Staff deleted successfully!');
            await loadAllData();
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        alert('❌ Failed to delete staff');
    }
}

async function markAttendance(staffId, status) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    const attendanceRecord = {
        'Attendance ID': 'ATT' + String(attendance.length + 1).padStart(4, '0'),
        'Staff ID': staffId,
        'Staff Name': staffMember.Name,
        'Date': new Date().toLocaleDateString('en-GB'),
        'Time': new Date().toLocaleTimeString(),
        'Status': status
    };
    
    try {
        const response = await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(attendanceRecord)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert(`✅ Attendance marked as ${status}`);
            await loadAllData();
        }
    } catch (error) {
        console.error('Error marking attendance:', error);
        alert('❌ Failed to mark attendance');
    }
}

// ==================== ATTENDANCE CALENDAR ====================
function renderAttendanceCalendar() {
    const monthDisplay = document.getElementById('attendanceMonthDisplay');
    const calendarView = document.getElementById('attendanceCalendarView');
    const reportView = document.getElementById('attendanceReportView');
    
    if (!monthDisplay) return;
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    const year = currentAttendanceMonth.getFullYear();
    const month = currentAttendanceMonth.getMonth();
    
    monthDisplay.textContent = `${monthNames[month]} ${year}`;
    
    if (currentAttendanceView === 'calendar') {
        calendarView.style.display = 'block';
        reportView.style.display = 'none';
        renderCalendarView(year, month);
    } else {
        calendarView.style.display = 'none';
        reportView.style.display = 'block';
        renderReportView(year, month);
    }
}

function renderCalendarView(year, month) {
    const grid = document.getElementById('attendanceGrid');
    if (!grid) return;
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    let html = `
        <div style="display: grid; grid-template-columns: 150px repeat(${daysInMonth}, 50px); gap: 2px; background: #ecf0f1; padding: 10px; border-radius: 8px; overflow-x: auto;">
            <div style="background: #34495e; color: white; padding: 10px; font-weight: bold; position: sticky; left: 0; z-index: 10;">Staff Name</div>`;
    
    for (let day = 1; day <= daysInMonth; day++) {
        html += `<div style="background: #34495e; color: white; padding: 10px; text-align: center; font-weight: bold; min-width: 50px;">${day}</div>`;
    }
    
    if (staff.length === 0) {
        html += `<div style="grid-column: 1 / -1; padding: 30px; text-align: center; color: #7f8c8d; background: white; border-radius: 5px;">No staff members added yet</div>`;
    } else {
        staff.forEach(staffMember => {
            html += `<div style="background: white; padding: 10px; font-weight: 600; position: sticky; left: 0; z-index: 5; border-right: 2px solid #bdc3c7;">${staffMember.Name}</div>`;
            
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const staffKey = `${staffMember['Staff ID']}_${dateKey}`;
                
                const attendanceRecord = attendance.find(a => {
                    const aDate = a.Date.split('/').reverse().join('-');
                    return a['Staff ID'] === staffMember['Staff ID'] && aDate === dateKey;
                });
                
                let bgColor = '#ecf0f1';
                let text = '-';
                let borderColor = '#bdc3c7';
                
                if (attendanceRecord) {
                    if (attendanceRecord.Status === 'Present') {
                        bgColor = '#2ecc71';
                        text = 'P';
                        borderColor = '#27ae60';
                    } else if (attendanceRecord.Status === 'Absent') {
                        bgColor = '#e74c3c';
                        text = 'A';
                        borderColor = '#c0392b';
                    }
                }
                
                html += `<div style="background: ${bgColor}; color: ${text === '-' ? '#7f8c8d' : 'white'}; padding: 10px; text-align: center; font-weight: bold; border: 2px solid ${borderColor}; min-width: 50px; cursor: pointer;" 
                         onclick="markAttendanceFromCalendar('${staffMember['Staff ID']}', '${dateKey}')" 
                         title="Click to mark attendance">${text}</div>`;
            }
        });
    }
    
    html += `</div>`;
    grid.innerHTML = html;
}

function renderReportView(year, month) {
    const reportTable = document.getElementById('attendanceReportTable');
    if (!reportTable) return;
    
    if (staff.length === 0) {
        reportTable.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #7f8c8d;">No staff members added yet</td></tr>';
        return;
    }
    
    let html = '';
    
    staff.forEach(staffMember => {
        const staffAttendance = attendance.filter(a => {
            const aDate = new Date(a.Date.split('/').reverse().join('-'));
            return a['Staff ID'] === staffMember['Staff ID'] && 
                   aDate.getMonth() === month && 
                   aDate.getFullYear() === year;
        });
        
        const presentDays = staffAttendance.filter(a => a.Status === 'Present').length;
        const absentDays = staffAttendance.filter(a => a.Status === 'Absent').length;
        const totalMarked = presentDays + absentDays;
        const attendancePercent = totalMarked > 0 ? ((presentDays / totalMarked) * 100).toFixed(1) : 0;
        
        const percentColor = attendancePercent >= 80 ? '#27ae60' : 
                            attendancePercent >= 60 ? '#f39c12' : '#e74c3c';
        
        html += `
            <tr>
                <td>${staffMember.Name}</td>
                <td>${staffMember.Position}</td>
                <td style="color: #27ae60; font-weight: bold;">${presentDays}</td>
                <td style="color: #e74c3c; font-weight: bold;">${absentDays}</td>
                <td>${totalMarked}</td>
                <td style="color: ${percentColor}; font-weight: bold; font-size: 16px;">${attendancePercent}%</td>
            </tr>
        `;
    });
    
    reportTable.innerHTML = html;
}

function markAttendanceFromCalendar(staffId, dateKey) {
    const staffMember = staff.find(s => s['Staff ID'] === staffId);
    if (!staffMember) return;
    
    const dateObj = new Date(dateKey);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dateObj.setHours(0, 0, 0, 0);
    
    if (dateObj > today) {
        alert('⚠️ Cannot mark attendance for future dates');
        return;
    }
    
    const existingRecord = attendance.find(a => {
        const aDate = a.Date.split('/').reverse().join('-');
        return a['Staff ID'] === staffId && aDate === dateKey;
    });
    
    if (existingRecord) {
        const changeStatus = confirm(
            `Current Status: ${existingRecord.Status}\n\n` +
            `Do you want to change it?\n` +
            `OK = Present | Cancel = Absent`
        );
        
        existingRecord.Status = changeStatus ? 'Present' : 'Absent';
        existingRecord.Time = new Date().toLocaleTimeString();
        
        saveAttendanceToServer(existingRecord);
    } else {
        const status = confirm(
            `Mark attendance for ${staffMember.Name}?\n\n` +
            `OK = Present | Cancel = Absent`
        ) ? 'Present' : 'Absent';
        
        const newRecord = {
            'Attendance ID': 'ATT' + String(attendance.length + 1).padStart(4, '0'),
            'Staff ID': staffId,
            'Staff Name': staffMember.Name,
            'Date': dateKey.split('-').reverse().join('/'),
            'Time': new Date().toLocaleTimeString(),
            'Status': status
        };
        
        attendance.push(newRecord);
        saveAttendanceToServer(newRecord);
    }
    
    renderAttendanceCalendar();
}

async function saveAttendanceToServer(record) {
    try {
        await fetch(`${API_URL}/attendance`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
        });
    } catch (error) {
        console.error('Error saving attendance:', error);
    }
}

function previousAttendanceMonth() {
    currentAttendanceMonth.setMonth(currentAttendanceMonth.getMonth() - 1);
    renderAttendanceCalendar();
}

function nextAttendanceMonth() {
    currentAttendanceMonth.setMonth(currentAttendanceMonth.getMonth() + 1);
    renderAttendanceCalendar();
}

function switchAttendanceView(view) {
    currentAttendanceView = view;
    
    const calendarBtn = document.getElementById('calendarViewBtn');
    const reportBtn = document.getElementById('reportViewBtn');
    
    if (view === 'calendar') {
        calendarBtn.style.background = '#3498db';
        calendarBtn.style.color = 'white';
        reportBtn.style.background = '#95a5a6';
        reportBtn.style.color = 'white';
    } else {
        calendarBtn.style.background = '#95a5a6';
        calendarBtn.style.color = 'white';
        reportBtn.style.background = '#3498db';
        reportBtn.style.color = 'white';
    }
    
    renderAttendanceCalendar();
}

// ==================== PRINT INVOICE ====================

function printInvoice(bookingId) {
    const booking = bookings.find(b => b['Booking ID'] === bookingId);
    if (!booking) return;
    
    const bookingPayments = payments.filter(p => p['Booking ID'] === bookingId);
    let paymentHistoryHTML = '';
    
    if (bookingPayments.length > 0) {
        const totalPaid = bookingPayments.reduce((sum, p) => sum + parseInt(p.Amount), 0);
        paymentHistoryHTML = `
            <div style="margin: 20px 0; padding: 15px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 8px;">
                <h3 style="color: #2e7d32; margin: 0 0 12px 0; font-size: 16px;">💰 Payment History</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: white;">
                    <thead><tr style="background: #4caf50; color: white;">
                        <th style="padding: 8px; text-align: left;">Date</th>
                        <th style="padding: 8px; text-align: left;">Payment ID</th>
                        <th style="padding: 8px; text-align: left;">Mode</th>
                        <th style="padding: 8px; text-align: right;">Amount</th>
                    </tr></thead>
                    <tbody>
                        ${bookingPayments.map((p, idx) => `
                            <tr style="background: ${idx % 2 === 0 ? '#f1f8e9' : 'white'};">
                                <td style="padding: 8px;">${p['Date']}</td>
                                <td style="padding: 8px;">${p['Payment ID']}</td>
                                <td style="padding: 8px; text-transform: uppercase;">${p['Payment Mode']}</td>
                                <td style="padding: 8px; text-align: right; font-weight: bold;">₹${p['Amount']}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #c8e6c9; font-weight: bold;">
                            <td colspan="3" style="padding: 10px; text-align: right;">Total Paid:</td>
                            <td style="padding: 10px; text-align: right; font-size: 16px;">₹${totalPaid}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        `;
    }
    
    let foodHTML = '';
    if (booking['Food Orders']?.length) {
        foodHTML = booking['Food Orders'].map(i => 
            `<tr><td>${i.name} (x${i.quantity})</td><td style="text-align: right;">₹${i.total}</td></tr>`
        ).join('');
    }
    
    const nights = booking.Nights || calculateNights(booking['Check In'], booking['Check Out']);
    const roomType = booking['Room Type'] || 'N/A';
    const roomAmountPerNight = booking['Room Price Per Night'] || 0;
    const totalRoomAmount = booking['Room Amount'] || (roomAmountPerNight * nights);
    
    // ✅ FIX: Calculate correct balance
    const totalAmount = parseInt(booking['Total Amount']) || 0;
    const bookingPaymentsForBalance = payments.filter(p => p['Booking ID'] === bookingId);
    const totalPaidForBalance = bookingPaymentsForBalance.reduce((sum, p) => sum + parseInt(p.Amount || 0), 0);
    const currentBalance = totalAmount - totalPaidForBalance;

    const w = window.open('', '_blank', 'width=900,height=700');
    w.document.write(`<!DOCTYPE html>
<html><head><title>Invoice - ${booking['Booking ID']}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; padding: 15px; max-width: 800px; margin: 0 auto; font-size: 13px; }
.header { text-align: center; margin-bottom: 15px; border-bottom: 3px solid #2c3e50; padding-bottom: 12px; }
h1 { margin: 8px 0 3px; color: #2c3e50; font-size: 24px; }
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
th { background: #2c3e50; color: white; }
.summary-box { margin: 12px 0; padding: 12px; background: #fff3e0; border-radius: 6px; border: 2px solid #ff9800; }
</style></head>
<body>
<div class="header">
    <h1>SAI GANGA HOTEL</h1>
    <div style="font-size: 11px; margin: 8px 0;">${HOTEL_ADDRESS}</div>
    <p style="color: #27ae60; font-weight: bold;">🌿 100% PURE VEG</p>
    <div style="font-size: 18px; margin: 12px 0; font-weight: bold;">BOOKING INVOICE</div>
    <p><strong>Invoice:</strong> ${booking['Booking ID']}</p>
    <p style="font-size: 11px;">Date: ${booking['Date']} | Time: ${booking['Time']}</p>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 12px 0;">
    <div style="padding: 10px; background: #f8f9fa; border-radius: 6px;">
        <h3 style="font-size: 13px; margin-bottom: 6px;">👤 Customer</h3>
        <p><strong>Name:</strong> ${booking['Customer Name']}</p>
        <p><strong>Mobile:</strong> ${booking['Mobile']}</p>
        <p><strong>Address:</strong> ${booking['Address'] || 'N/A'}</p>
        <p><strong>Persons:</strong> ${booking['No. of Persons']}</p>
    </div>
    <div style="padding: 10px; background: #f8f9fa; border-radius: 6px;">
        <h3 style="font-size: 13px; margin-bottom: 6px;">🏨 Booking</h3>
        <p><strong>Room:</strong> ${booking['Room Number']} (${roomType})</p>
        <p><strong>Check-in:</strong> ${booking['Check In']} ${booking['Check In Time'] || ''}</p>
        <p><strong>Check-out:</strong> ${booking['Check Out'] || 'Not set'} ${booking['Check Out Time'] ? `<span style="color: #e74c3c; font-weight: bold;">${booking['Check Out Time']}</span>` : ''}</p>
        <p><strong>Nights:</strong> ${nights}</p>
    </div>
</div>

${paymentHistoryHTML}

<table>
    <thead><tr><th>Description</th><th style="text-align: right;">Amount</th></tr></thead>
    <tbody>
        <tr><td>🛏️ Room Charges (${nights} ${nights === 1 ? 'night' : 'nights'} @ ₹${roomAmountPerNight}/night)</td>
            <td style="text-align: right; font-weight: bold;">₹${totalRoomAmount}</td></tr>
        ${booking['Additional Amount'] > 0 ? `<tr><td>➕ Additional Charges</td><td style="text-align: right; font-weight: bold;">₹${booking['Additional Amount']}</td></tr>` : ''}
        ${foodHTML}
    </tbody>
</table>

<div class="summary-box">
    <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-bottom: 6px;">
        <span>💵 Total Amount:</span><span>₹${totalAmount}</span>
    </div>
    <div style="display: flex; justify-content: space-between; color: #2e7d32; margin: 6px 0;">
        <span>✅ Paid:</span><span>₹${totalPaidForBalance}</span>
    </div>
    <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold; color: ${currentBalance === 0 ? '#2e7d32' : '#c62828'}; padding-top: 8px; border-top: 2px solid #ff9800;">
        <span>${currentBalance === 0 ? '✅' : '⚠️'} Balance:</span><span>₹${currentBalance}</span>
    </div>
</div>

${booking['Note'] ? `<div style="margin: 12px 0; padding: 10px; background: #fff9c4; border-left: 4px solid #fbc02d;">
    <p style="font-size: 11px;"><strong>📝 Note:</strong></p>
    <p style="font-size: 12px; margin-top: 4px;">${booking['Note']}</p>
</div>` : ''}

<div style="text-align: center; margin-top: 15px; padding-top: 12px; border-top: 2px solid #ddd; font-size: 11px;">
    <p style="font-weight: bold; font-size: 14px;">Thank you! 🙏</p>
    <p style="margin: 8px 0; font-weight: bold;">📞 8390400008</p>
</div>
</body></html>`);
    w.document.close();
    setTimeout(() => w.print(), 500);
}

function printFoodInvoice(invoice) {
    console.log('Print food invoice:', invoice);
}

function shareWhatsApp(bookingId) {
    const b = bookings.find(x => x['Booking ID'] === bookingId);
    if (!b) return;
    
    const msg = `*SAI GANGA HOTEL - BOOKING*\n📋 ${b['Booking ID']}\n👤 ${b['Customer Name']}\n🏠 Room: ${b['Room Number']}\n💰 Total: ₹${b['Total Amount']}\n✅ Paid: ₹${b['Advance']}\n⚠️ Balance: ₹${b['Balance']}`;
    
    window.open(`https://wa.me/91${b['Mobile']}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ==================== SEARCH & EXPORT ====================

function searchBookings() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}

function searchCustomers() {
    const searchTerm = document.getElementById('customerSearch')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}

function searchPayments() {
    const searchTerm = document.getElementById('paymentSearch')?.value.toLowerCase() || '';
    if (!searchTerm) { updateAllTables(); return; }
}

function exportExcel() {
    window.open(`https://updatedhotelmanagement.onrender.com/api/download`, '_blank');
}

console.log('🚀 Dashboard JS fully loaded!');
