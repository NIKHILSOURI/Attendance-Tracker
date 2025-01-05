import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bodyParser from 'body-parser';
import path from 'path';

// Initialize dotenv
dotenv.config();

const app = express();
const PORT = process.env.PORT;

// Get current directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(bodyParser.json());
app.use(cookieParser());
app.use(express.static('public'));

// Models
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    }
}, { timestamps: true });

const attendanceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    totalClasses: {
        type: Number,
        required: true,
        min: 0
    },
    attendedClasses: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const attendanceRecordSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: { 
        type: String, 
        required: true 
    }
});

const absenceNoteSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    date: { 
        type: String, 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    }
});

const timetableSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    timeSlots: [{
        type: String,
        required: true
    }],
    days: [{
        day: {
            type: String,
            required: true,
            enum: ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']
        },
        subjects: [{
            type: String,
            default: ''
        }]
    }]
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
const Attendance = mongoose.model('Attendance', attendanceSchema);
const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
const AbsenceNote = mongoose.model('AbsenceNote', absenceNoteSchema);
const Timetable = mongoose.model('Timetable', timetableSchema);

// Authentication middleware
const auth = async (req, res, next) => {
    try {
        const token = req.cookies.token || req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.user = await User.findById(decoded.id);
        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 8);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ message: 'Registration failed' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            throw new Error();
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'your-secret-key');
        res.cookie('token', token, { httpOnly: true });
        res.json({ token, name: user.name });
    } catch (error) {
        res.status(400).json({ message: 'Login failed' });
    }
});

// Attendance routes
app.post('/api/attendance', auth, async (req, res) => {
    try {
        const { subject, totalClasses, attendedClasses, date } = req.body;
        
        // Find existing attendance record or create new one
        let attendance = await Attendance.findOne({
            userId: req.user._id,
            subject: subject
        });

        if (attendance) {
            // Update existing record
            attendance.totalClasses = totalClasses;
            attendance.attendedClasses = attendedClasses;
            attendance.date = date;
            await attendance.save();
        } else {
            // Create new record
            attendance = new Attendance({
                userId: req.user._id,
                subject,
                totalClasses,
                attendedClasses,
                date
            });
            await attendance.save();
        }

        res.status(201).json(attendance);
    } catch (error) {
        console.error('Error saving attendance:', error);
        res.status(400).json({ message: 'Failed to save attendance' });
    }
});

app.get('/api/attendance', auth, async (req, res) => {
    try {
        const attendance = await Attendance.find({ 
            userId: req.user._id 
        }).sort({ subject: 1 });
        res.json(attendance);
    } catch (error) {
        res.status(400).json({ message: 'Failed to fetch attendance' });
    }
});

// Timetable routes
app.post('/api/timetable', auth, async (req, res) => {
    try {
        const { timeSlots, days } = req.body;
        
        // Find existing timetable or create new one
        let timetable = await Timetable.findOne({ userId: req.user._id });
        
        if (timetable) {
            // Update existing timetable
            timetable.timeSlots = timeSlots;
            timetable.days = days;
            await timetable.save();
        } else {
            // Create new timetable
            timetable = new Timetable({
                userId: req.user._id,
                timeSlots,
                days
            });
            await timetable.save();
        }
        
        res.json({ message: 'Timetable saved successfully', timetable });
    } catch (error) {
        console.error('Error saving timetable:', error);
        res.status(500).json({ error: 'Failed to save timetable' });
    }
});

app.get('/api/timetable', auth, async (req, res) => {
    try {
        const timetable = await Timetable.findOne({ userId: req.user._id });
        if (!timetable) {
            return res.json({ timeSlots: [], days: [] });
        }
        res.json(timetable);
    } catch (error) {
        console.error('Error fetching timetable:', error);
        res.status(500).json({ error: 'Failed to fetch timetable' });
    }
});

// Attendance dates routes
app.get('/api/attendance-dates', auth, async (req, res) => {
    try {
        const records = await AttendanceRecord.find({ 
            userId: req.user._id 
        });
        res.json(records);
    } catch (error) {
        res.status(400).json({ message: 'Failed to fetch attendance records' });
    }
});

app.post('/api/attendance-dates', auth, async (req, res) => {
    try {
        const { date } = req.body;
        const record = new AttendanceRecord({
            userId: req.user._id,
            date
        });
        await record.save();
        res.status(201).json(record);
    } catch (error) {
        res.status(400).json({ message: 'Failed to mark attendance' });
    }
});

app.delete('/api/attendance-dates', auth, async (req, res) => {
    try {
        const { date } = req.body;
        await AttendanceRecord.deleteOne({
            userId: req.user._id,
            date
        });
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ message: 'Failed to unmark attendance' });
    }
});

// Absence notes routes
app.get('/api/absence-notes', auth, async (req, res) => {
    try {
        const notes = await AbsenceNote.find({ 
            userId: req.user._id 
        }).sort({ date: -1 });
        res.json(notes);
    } catch (error) {
        res.status(400).json({ message: 'Failed to fetch absence notes' });
    }
});

app.post('/api/absence-notes', auth, async (req, res) => {
    try {
        const { date, text } = req.body;
        const note = new AbsenceNote({
            userId: req.user._id,
            date,
            text
        });
        await note.save();
        res.status(201).json(note);
    } catch (error) {
        res.status(400).json({ message: 'Failed to add absence note' });
    }
});

app.delete('/api/absence-notes/:id', auth, async (req, res) => {
    try {
        await AbsenceNote.deleteOne({
            _id: req.params.id,
            userId: req.user._id
        });
        res.sendStatus(204);
    } catch (error) {
        res.status(400).json({ message: 'Failed to delete absence note' });
    }
});

// Add this new route
app.get('/api/user/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: 'Failed to fetch user profile' });
    }
});

// Root route - redirects to home page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Serve static files
app.use(express.static('public'));

// Handle all other routes to redirect to home
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

// Call the function when the database connects
mongoose.connection.on('connected', () => {
    console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection error:', err);
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
