const Board = require('../model/board')

exports.getBoards = async (req, res) => {
    try {
        const boards = await Board.find({});
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.createBoard = async (req, res) => {
    const { title, description } = req.body;
    try {
        const newBoard = new Board({ title, description });
        await newBoard.save();
        res.status(201).json(newBoard);
    } catch (error) {
        res.status(400).json({ error: 'Invalid request' });
    }

}

exports.updateBoard = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(id, { title, description }, { new: true });
        if (!updatedBoard) return res.status(404).json({ error: 'Board not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteBoard = async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    try {
        const deletedBoard = await Board.findByIdAndDelete(id);
        if (!deletedBoard) return res.status(404).json({ error: 'Board not found' });
        res.json(deletedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getBoardById = async (req, res) => {
    const { id } = req.params;

    if (!id) return res.status(400).json({ error: 'Invalid ID' });

    try {
        const board = await Board.findById(id);
        if (!board) return res.status(404).json({ error: 'Board not found' });
        res.json(board);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getBoardsByUser = async (req, res) => {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: 'Invalid user ID' });

    try {
        const boards = await Board.find({ user: userId });
        res.json(boards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.addUserToBoard = async (req, res) => {
    const { userId, boardId } = req.params;

    if (!userId ||!boardId) return res.status(400).json({ error: 'Invalid user or board ID' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(boardId, { $push: { users: userId } }, { new: true });
        if (!updatedBoard) return res.status(404).json({ error: 'Board not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.removeUserFromBoard = async (req, res) => {
    const { userId, boardId } = req.params;

    if (!userId ||!boardId) return res.status(400).json({ error: 'Invalid user or board ID' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(boardId, { $pull: { users: userId } }, { new: true });
        if (!updatedBoard) return res.status(404).json({ error: 'Board not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.addTaskToBoard = async (req, res) => {
    const { boardId } = req.params;
    const { title, description, dueDate } = req.body;

    if (!boardId ||!title ||!description ||!dueDate) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(boardId, { $push: { tasks: { title, description, dueDate } } }, { new: true });
        if (!updatedBoard) return res.status(404).json({ error: 'Board not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.updateTaskOnBoard = async (req, res) => {
    const { boardId, taskId } = req.params;
    const { title, description, dueDate, completed } = req.body;

    if (!boardId ||!taskId ||!title ||!description ||!dueDate) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(boardId, {
            $set: {
                'tasks.$[task].title': title,
                'tasks.$[task].description': description,
                'tasks.$[task].dueDate': dueDate,
                'tasks.$[task].completed': completed
            }
        }, {
            arrayFilters: [{ _id: taskId }],
            new: true
        });

        if (!updatedBoard) return res.status(404).json({ error: 'Board or task not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(404).json({ error: error.message });
}

}

exports.deleteTaskFromBoard = async (req, res) => {
    const { boardId, taskId } = req.params;

    if (!boardId ||!taskId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedBoard = await Board.findByIdAndUpdate(boardId, { $pull: { tasks: { _id: taskId } } }, { new: true });
        if (!updatedBoard) return res.status(404).json({ error: 'Board or task not found' });
        res.json(updatedBoard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getTasksByBoard = async (req, res) => {
    const { boardId } = req.params;

    if (!boardId) return res.status(400).json({ error: 'Invalid board ID' });

    try {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ error: 'Board not found' });
        res.json(board.tasks);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCompletedTasksByBoard = async (req, res) => {
    const { boardId } = req.params;

    if (!boardId) return res.status(400).json({ error: 'Invalid board ID' });

    try {
        const board = await Board.findById(boardId);
        if (!board) return res.status(404).json({ error: 'Board not found' });
        const completedTasks = board.tasks.filter(task => task.completed);
        res.json(completedTasks);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

