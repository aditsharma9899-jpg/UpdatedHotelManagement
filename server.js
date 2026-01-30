const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const connectDB = require('./config/db');


const bookingsRoutes = require('./routes/bookingRoutes')
const roomsRoutes = require("./routes/roomRoutes");
const customersRoutes = require("./routes/customerRoutes");
const paymentsRoutes = require("./routes/paymentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");


const app = express();
const PORT = process.env.PORT || 3001;

const DATA_FILE = path.join(__dirname, 'hotel_data.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DOCUMENTS_EXCEL = path.join(__dirname, 'documents');

// ✅ ENSURE DIRECTORIES EXIST
async function ensureDirs() {
    try {
        await fs.access(UPLOADS_DIR);
    } catch {
        await fs.mkdir(UPLOADS_DIR, { recursive: true });
        console.log('📁 Uploads directory created');
    }
    
    try {
        await fs.access(DOCUMENTS_EXCEL);
    } catch {
        await fs.mkdir(DOCUMENTS_EXCEL, { recursive: true });
        console.log('📁 Documents Excel directory created');
    }
}
connectDB()

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(__dirname));
app.use('/uploads', express.static(UPLOADS_DIR));

app.use("/newapi/bookings", bookingsRoutes);
app.use("/newapi/rooms", roomsRoutes);
app.use("/newapi/customers", customersRoutes);
app.use("/newapi/payments", paymentsRoutes);
app.use("/newapi/attendance", attendanceRoutes);
app.use("/newapi/staff", attendanceRoutes);

let rooms = [];
let bookings = [];
let customers = [];
let payments = [];
let staff = [];
let attendance = [];

function initializeRooms() {
    return [
        { 'Floor': 'first', 'Room Number': '101', 'Status': 'available', 'Type': 'Non AC', 'Price': 800 },
        { 'Floor': 'first', 'Room Number': '102', 'Status': 'available', 'Type': 'AC', 'Price': 1200 },
        { 'Floor': 'first', 'Room Number': '103', 'Status': 'available', 'Type': 'Non AC', 'Price': 800 },
        { 'Floor': 'second', 'Room Number': '201', 'Status': 'available', 'Type': 'AC', 'Price': 1500 },
        { 'Floor': 'second', 'Room Number': '202', 'Status': 'available', 'Type': 'AC', 'Price': 1500 },
        { 'Floor': 'second', 'Room Number': '203', 'Status': 'available', 'Type': 'Non AC', 'Price': 1000 },
        { 'Floor': 'second', 'Room Number': '204', 'Status': 'available', 'Type': 'Non AC', 'Price': 1000 },
        { 'Floor': 'third', 'Room Number': '301', 'Status': 'available', 'Type': 'Ac Hall', 'Price': 2500 },
        { 'Floor': 'third', 'Room Number': '302', 'Status': 'available', 'Type': 'AC', 'Price': 2000 },
        { 'Floor': 'third', 'Room Number': '303', 'Status': 'available', 'Type': 'AC', 'Price': 2000 }
    ];
}

async function loadData() {
    try {
        const fileExists = await fs.access(DATA_FILE).then(() => true).catch(() => false);
        
        if (fileExists) {
            const data = await fs.readFile(DATA_FILE, 'utf8');
            const parsedData = JSON.parse(data);
            
            rooms = parsedData.rooms || initializeRooms();
            bookings = parsedData.bookings || [];
            customers = parsedData.customers || [];
            payments = parsedData.payments || [];
            staff = parsedData.staff || [];
            attendance = parsedData.attendance || [];
            
            console.log('✅ Data loaded from file');
            console.log(`📊 Bookings: ${bookings.length}, Customers: ${customers.length}, Payments: ${payments.length}`);
        } else {
            rooms = initializeRooms();
            await saveData();
        }
    } catch (error) {
        console.error('❌ Error loading data:', error);
        rooms = initializeRooms();
    }
}

async function saveData() {
    try {
        const data = {
            rooms,
            bookings,
            customers,
            payments,
            staff,
            attendance,
            lastUpdated: new Date().toISOString()
        };
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('💾 Data saved successfully');
        return true;
    } catch (error) {
        console.error('❌ Error saving data:', error);
        return false;
    }
}

// ✅ AUTO-SAVE DOCUMENTS TO EXCEL
async function saveDocumentsToExcel(customerId, bookingId, documents) {
    try {
        const timestamp = new Date().toISOString().split('T')[0];
        const excelPath = path.join(DOCUMENTS_EXCEL, `Documents_${timestamp}.xlsx`);
        
        let workbook;
        let worksheet;
        
        if (fsSync.existsSync(excelPath)) {
            workbook = new ExcelJS.Workbook();
            await workbook.xlsx.readFile(excelPath);
            worksheet = workbook.getWorksheet('Documents');
            
            const stats = await fs.stat(excelPath);
            if (stats.size > 10 * 1024 * 1024) {
                const newTimestamp = Date.now();
                const newExcelPath = path.join(DOCUMENTS_EXCEL, `Documents_${timestamp}_${newTimestamp}.xlsx`);
                workbook = new ExcelJS.Workbook();
                worksheet = workbook.addWorksheet('Documents');
                worksheet.columns = [
                    { header: 'Upload Date', key: 'uploadDate', width: 20 },
                    { header: 'Customer ID', key: 'customerId', width: 15 },
                    { header: 'Booking ID', key: 'bookingId', width: 15 },
                    { header: 'Document Name', key: 'documentName', width: 30 },
                    { header: 'Type', key: 'type', width: 15 },
                    { header: 'File Path', key: 'filePath', width: 50 }
                ];
            }
        } else {
            workbook = new ExcelJS.Workbook();
            worksheet = workbook.addWorksheet('Documents');
            worksheet.columns = [
                { header: 'Upload Date', key: 'uploadDate', width: 20 },
                { header: 'Customer ID', key: 'customerId', width: 15 },
                { header: 'Booking ID', key: 'bookingId', width: 15 },
                { header: 'Document Name', key: 'documentName', width: 30 },
                { header: 'Type', key: 'type', width: 15 },
                { header: 'File Path', key: 'filePath', width: 50 }
            ];
        }
        
        documents.forEach(doc => {
            worksheet.addRow({
                uploadDate: new Date().toLocaleString(),
                customerId: customerId,
                bookingId: bookingId,
                documentName: doc.originalName,
                type: doc.type,
                filePath: doc.url
            });
        });
        
        await workbook.xlsx.writeFile(excelPath);
        console.log(`✅ Documents saved to Excel: ${excelPath}`);
        
        return excelPath;
    } catch (error) {
        console.error('❌ Error saving documents to Excel:', error);
        return null;
    }
}
// ✅ DOCUMENT UPLOAD - NO GOOGLE DRIVE LINKS
app.post('/api/documents/upload', async (req, res) => {
    try {
        const { customerId, bookingId, documents } = req.body;
        
        if (!documents || documents.length === 0) {
            return res.status(400).json({ 
                error: 'No documents provided'
            });
        }
        
        const uploadedDocs = [];
        
        for (const doc of documents) {
            const base64Data = doc.data.split(',')[1];
            const buffer = Buffer.from(base64Data, 'base64');
            
            const filename = `${bookingId}_doc${uploadedDocs.length + 1}_${Date.now()}${path.extname(doc.name)}`;
            const filePath = path.join(UPLOADS_DIR, filename);
            
            await fs.writeFile(filePath, buffer);
            
            uploadedDocs.push({
                filename: filename,
                originalName: doc.name,
                type: doc.type,
                uploadDate: new Date().toISOString(),
                url: `/uploads/${filename}`
            });
        }
        
        const customer = customers.find(c => c['Customer ID'] === customerId);
        if (customer) {
            if (!customer.documents) customer.documents = [];
            customer.documents.push(...uploadedDocs);
        }
        
        await saveDocumentsToExcel(customerId, bookingId, uploadedDocs);
        await saveData();
        
        res.json({
            success: true,
            documents: uploadedDocs,
            message: `${uploadedDocs.length} document(s) uploaded successfully`
        });
        
    } catch (err) {
        console.error('❌ Document upload error:', err);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// ✅ GET CUSTOMER DOCUMENTS
app.get('/api/customers/:id/documents', async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = customers.find(c => c['Customer ID'] === customerId);
        
        if (!customer || !customer.documents) {
            return res.json({ documents: [] });
        }
        
        res.json({ documents: customer.documents });
    } catch (error) {
        console.error('❌ Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// Auto-save every 30 seconds
setInterval(async () => {
    await saveData();
}, 30000);

(async () => {
    await ensureDirs();
    await loadData();
    console.log('🚀 Server initialized');
})();

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});


app.post('/api/bookings/:id/checkout', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const booking = bookings.find(b => b['Booking ID'] === bookingId);
        
        if (booking) {
            const checkoutTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
            
            booking['Check Out Time'] = checkoutTime;
            booking.Status = 'Checked Out';
            
            if (booking['Room Number'] && !booking['Room Number'].includes('TBD')) {
                const roomNumbers = booking['Room Number'].split(', ');
                roomNumbers.forEach(roomNum => {
                    const room = rooms.find(r => r['Room Number'] === roomNum.trim());
                    if (room) room.Status = 'available';
                });
            }
            
            await saveData();
            res.json({ success: true, checkoutTime: checkoutTime });
        } else {
            res.status(404).json({ error: 'Booking not found' });
        }
    } catch (error) {
        console.error('❌ Error during checkout:', error);
        res.status(500).json({ error: 'Failed to checkout' });
    }
});

app.post('/api/bookings/:id/allocate-room', async (req, res) => {
    try {
        const bookingId = req.params.id;
        const { roomNumbers } = req.body;
        const booking = bookings.find(b => b['Booking ID'] === bookingId);
        
        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        if (booking.Status !== 'Advance Booking') {
            return res.status(400).json({ error: 'Not an advance booking' });
        }
        
        booking['Room Number'] = roomNumbers;
        booking.Status = 'Confirmed';
        
        const roomNumbersList = roomNumbers.split(', ');
        roomNumbersList.forEach(roomNum => {
            const room = rooms.find(r => r['Room Number'] === roomNum.trim());
            if (room) room.Status = 'occupied';
        });
        
        await saveData();
        
        res.json({ success: true, booking });
    } catch (error) {
        console.error('❌ Error allocating room:', error);
        res.status(500).json({ error: 'Failed to allocate room' });
    }
});


app.get('/api/download', async (req, res) => {
    try {
        const workbook = new ExcelJS.Workbook();
        
        const bookingsSheet = workbook.addWorksheet('Bookings');
        bookingsSheet.columns = [
            { header: 'Booking ID', key: 'Booking ID', width: 15 },
            { header: 'Customer Name', key: 'Customer Name', width: 20 },
            { header: 'Mobile', key: 'Mobile', width: 15 },
            { header: 'Room Number', key: 'Room Number', width: 12 },
            { header: 'Check In', key: 'Check In', width: 15 },
            { header: 'Check Out', key: 'Check Out', width: 15 },
            { header: 'Nights', key: 'Nights', width: 10 },
            { header: 'Room Price/Night', key: 'Room Price Per Night', width: 15 },
            { header: 'Room Amount', key: 'Room Amount', width: 15 },
            { header: 'Total Amount', key: 'Total Amount', width: 15 },
            { header: 'Balance', key: 'Balance', width: 12 },
            { header: 'Status', key: 'Status', width: 12 }
        ];
        bookingsSheet.addRows(bookings);
        
        const customersSheet = workbook.addWorksheet('Customers');
        customersSheet.columns = [
            { header: 'Customer ID', key: 'Customer ID', width: 15 },
            { header: 'Name', key: 'Name', width: 20 },
            { header: 'Mobile', key: 'Mobile', width: 15 },
            { header: 'Address', key: 'Address', width: 30 },
            { header: 'Total Bookings', key: 'Total Bookings', width: 15 }
        ];
        customersSheet.addRows(customers);
        
        const paymentsSheet = workbook.addWorksheet('Payments');
        paymentsSheet.columns = [
            { header: 'Payment ID', key: 'Payment ID', width: 15 },
            { header: 'Booking ID', key: 'Booking ID', width: 15 },
            { header: 'Customer Name', key: 'Customer Name', width: 20 },
            { header: 'Amount', key: 'Amount', width: 12 },
            { header: 'Payment Mode', key: 'Payment Mode', width: 15 },
            { header: 'Date', key: 'Date', width: 15 }
        ];
        paymentsSheet.addRows(payments);
        
        const filename = `SaiGanga_Hotel_${new Date().toISOString().split('T')[0]}.xlsx`;
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('❌ Error generating Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel file' });
    }
});

let sessions = {};

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === 'admin' && password === 'admin@123') {
        const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        sessions[sessionId] = {
            username: username,
            createdAt: new Date(),
            lastAccess: new Date()
        };
        
        res.json({ success: true, sessionId: sessionId });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/verify-session', (req, res) => {
    const { sessionId } = req.body;
    
    if (sessions[sessionId]) {
        sessions[sessionId].lastAccess = new Date();
        res.json({ valid: true });
    } else {
        res.json({ valid: false });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`💾 Data persistence: ENABLED`);
    console.log(`📁 Documents auto-save to Excel: ENABLED`);
    console.log(`📊 Current data: Bookings: ${bookings.length}, Customers: ${customers.length}`);
});