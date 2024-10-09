const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    list: { type: mongoose.Schema.Types.ObjectId, ref: 'List' }, // Belongs to a list
    position: { type: Number, default: 0 }, // For ordering tasks within a list
    dueDate: { type: Date },
    assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Users assigned to the task
    progress: { type: String, enum: ['Not Started', 'In Progress', 'Completed'], default: 'Not Started' }, // Progress tracking
    createdAt: { type: Date, default: Date.now }
});