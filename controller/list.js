const List = require('../model/list')

exports.getLists = async (req, res) => {
    try {
        const lists = await List.find({});
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.createList = async (req, res) => {
    const { title, boardId } = req.body;

    if (!title ||!boardId) return res.status(400).json({ error: 'All fields are required' });

    try {
        const newList = new List({ title, board: boardId });
        await newList.save();
        res.status(201).json(newList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.updateList = async (req, res) => {
    const { listId, title } = req.body;

    if (!listId ||!title) return res.status(400).json({ error: 'All fields are required' });

    try {
        const updatedList = await List.findByIdAndUpdate(listId, { title }, { new: true });
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteList = async (req, res) => {
    try{
        const deletedList = await List.findByIdAndDelete(req.params.listId);
        res.json(deletedList);
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    
    }
}

exports.getTasksOnList = async (req, res) => {
    const { listId } = req.params;

    if (!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });

        const tasks = await Task.find({ list: listId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsOnList = async (req, res) => {
    const { listId } = req.params;

    if (!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });

        const cards = await Card.find({ list: listId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.moveListToBoard = async (req, res) => {
    const { listId, boardId } = req.body;

    if (!listId ||!boardId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedList = await List.findByIdAndUpdate(listId, { board: boardId }, { new: true });
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.archiveList = async (req, res) => {
    try{
        const list = await List.findByIdAndUpdate(req.params.listId, { archived: true }, { new: true });
        res.json(list);
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getArchivedLists = async (req, res) => {
    try {
        const archivedLists = await List.find({ archived: true });
        res.json(archivedLists);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.unarchiveList = async (req, res) => {
    try{
        const list = await List.findByIdAndUpdate(req.params.listId, { archived: false }, { new: true });
        res.json(list);
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getListsByBoard = async (req, res) => {
    const { boardId } = req.params;

    if (!boardId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const lists = await List.find({ board: boardId });
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getListsByUser = async (req, res) => {
    const { userId } = req.params;

    if (!userId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const lists = await List.find({ users: userId });
        res.json(lists);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.addUserToList = async (req, res) => {
    const { userId, listId } = req.params;

    if (!userId ||!listId) return res.status(400).json({ error: 'Invalid user or list ID' });

    try {
        const updatedList = await List.findByIdAndUpdate(listId, { $push: { users: userId } }, { new: true });
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.removeUserFromList = async (req, res) => {
    const { userId, listId } = req.params;

    if (!userId ||!listId) return res.status(400).json({ error: 'Invalid user or list ID' });

    try {
        const updatedList = await List.findByIdAndUpdate(listId, { $pull: { users: userId } }, { new: true });
        res.json(updatedList);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getUsersOnList = async (req, res) => {
    const { listId } = req.params;

    if (!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const list = await List.findById(listId);
        if (!list) return res.status(404).json({ error: 'List not found' });

        const users = await User.find({ _id: { $in: list.users } });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.moveListToTop = async (req, res) => {
    const { listId, boardId } = req.params;

    if (!listId ||!boardId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedLists = await List.updateMany(
            { board: boardId },
            { $pull: { _id: listId } },
            { new: true }
        );

        await List.findByIdAndUpdate(listId, { $push: { board: boardId } }, { new: true });

        res.json(updatedLists);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.moveListToBottom = async (req, res) => {
    const { listId, boardId } = req.params;

    if (!listId || !boardId) {
        return res.status(400).json({ error: 'Invalid request' });
    }

    try {
        // Fetch the current lists for the board
        const lists = await List.find({ board: boardId }).sort({ position: 1 });

        if (!lists.length) return res.status(404).json({ error: 'No lists found for the board' });

        // Find the current list to be moved
        const currentList = lists.find(list => list._id.toString() === listId);

        if (!currentList) return res.status(404).json({ error: 'List not found' });

        // Set the current list to the last position
        const lastPosition = lists.length;
        await List.findByIdAndUpdate(listId, { position: lastPosition }, { new: true });

        res.status(200).json({ message: 'List moved to bottom successfully' });
    } catch (e) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.moveListToPosition = async (req, res) => {
    try {
        const { listId, boardId, newPosition } = req.body;

        if (!listId || !boardId || newPosition === undefined) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Fetch the current lists for the board
        const lists = await List.find({ board: boardId }).sort({ position: 1 });

        // Ensure the newPosition is within bounds
        const targetPosition = Math.max(0, Math.min(lists.length - 1, newPosition));

        // Find the list to be moved
        const currentListIndex = lists.findIndex(list => list._id.toString() === listId);

        if (currentListIndex === -1) return res.status(404).json({ error: 'List not found' });

        // Check if the list is already in the desired position
        if (currentListIndex === targetPosition) {
            return res.status(400).json({ error: 'List is already in the target position' });
        }

        // Get the current list
        const currentList = lists[currentListIndex];

        // Shift positions for other lists to make room for the moved list
        const updatedLists = lists.map((list, index) => {
            if (index === currentListIndex) {
                // Set the list to be moved to the new position
                return { ...list, position: targetPosition };
            }
            if (index >= Math.min(currentListIndex, targetPosition) && index <= Math.max(currentListIndex, targetPosition)) {
                // Shift other lists up or down
                return { ...list, position: index < targetPosition ? index : index - 1 };
            }
            return list;
        });

        // Save all updated list positions in the database
        await Promise.all(updatedLists.map(async (list) => {
            return List.findByIdAndUpdate(list._id, { position: list.position }, { new: true });
        }));

        res.status(200).json({ message: 'List moved successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
exports.reorderLists = async (req, res) => {
    try {
        const { boardId, listOrder } = req.body;

        // Validate input
        if (!boardId || !Array.isArray(listOrder)) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        // Fetch the current lists for the board
        const lists = await List.find({ board: boardId }).sort({ position: 1 });

        // Ensure that the listOrder is valid
        const isValidOrder = listOrder.every((listId) => 
            lists.some((list) => list._id.toString() === listId)
        );

        if (!isValidOrder) {
            return res.status(400).json({ error: 'Invalid list order' });
        }

        // Update the positions of the lists
        await Promise.all(
            listOrder.map(async (listId, index) => {
                return List.findByIdAndUpdate(listId, { position: index }, { new: true });
            })
        );

        res.status(200).json({ message: 'Lists reordered successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

