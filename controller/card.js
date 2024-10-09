const card = require('../model/cards');


exports.getCards = async (req, res) => {
    try {
        const cards = await Card.find({});
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.createCard = async (req, res) => {
    const { title, description, listId } = req.body;

    if (!title ||!description ||!listId) return res.status(400).json({ error: 'All fields are required' });

    try {
        const newCard = new Card({ title, description, list: listId });
        await newCard.save();
        res.status(201).json(newCard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.updateCard = async (req, res) => {
    const { cardId, title, description } = req.body;

    if (!cardId ||!title ||!description) return res.status(400).json({ error: 'All fields are required' });

    try {
        const updatedCard = await Card.findByIdAndUpdate(cardId, { title, description }, { new: true });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.deleteCard = async (req, res) => {
    const { cardId } = req.params;

    if (!cardId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const deletedCard = await Card.findByIdAndDelete(cardId);
        res.json(deletedCard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.moveCardToList = async (req, res) => {
    const { cardId, listId } = req.body;

    if (!cardId ||!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const updatedCard = await card.findByIdAndUpdate(cardId, { list: listId }, { new: true });
        res.json(updatedCard);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.archiveCard = async (req, res) => {
    try{
        const card = await Card.findByIdAndUpdate(req.params.cardId, { archived: true }, { new: true });
        res.json(card);
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.unarchiveCard = async (req, res) => {
    try{
        const card = await Card.findByIdAndUpdate(req.params.cardId, { archived: false }, { new: true });
        res.json(card);
        } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getArchivedCards = async (req, res) => {
    try {
        const cards = await Card.find({ archived: true });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsOnList = async (req, res) => {
    const { listId } = req.params;

    if (!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ list: listId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsNotOnList = async (req, res) => {
    const { listId } = req.params;

    if (!listId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ list: { $ne: listId } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithLabel = async (req, res) => {
    const { labelId } = req.params;

    if (!labelId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ labels: labelId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithNoLabel = async (req, res) => {
    try {
        const cards = await Card.find({ labels: { $exists: false } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithDueDate = async (req, res) => {
    const { dueDate } = req.params;

    if (!dueDate) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ dueDate: { $gte: new Date(dueDate) } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithNoDueDate = async (req, res) => {
    try {
        const cards = await Card.find({ dueDate: { $exists: false } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithPriority = async (req, res) => {
    const { priority } = req.params;

    if (!priority) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ priority });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithNoPriority = async (req, res) => {
    try {
        const cards = await Card.find({ priority: { $exists: false } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithComment = async (req, res) => {
    const { commentId } = req.params;

    if (!commentId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ comments: commentId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithNoComment = async (req, res) => {
    try {
        const cards = await Card.find({ comments: { $exists: false } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithAttachment = async (req, res) => {
    const { attachmentId } = req.params;

    if (!attachmentId) return res.status(400).json({ error: 'Invalid request' });

    try {
        const cards = await Card.find({ attachments: attachmentId });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}

exports.getCardsWithNoAttachment = async (req, res) => {
    try {
        const cards = await Card.find({ attachments: { $exists: false } });
        res.json(cards);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
}
