const complaintService = require('../services/complaint.service');
const { asyncHandler } = require('../middlewares/error.middleware');

const complaintController = {
  index: asyncHandler(async (req, res) => {
    const complaints = await complaintService.listForUser(req.user.id);
    res.render('client/complaints', {
      title: 'Réclamations',
      complaints,
    });
  }),

  create: asyncHandler(async (req, res) => {
    await complaintService.create({
      userId: req.user.id,
      subject: req.body.subject,
      message: req.body.message,
    });
    req.flash('success', 'Réclamation enregistrée.');
    res.redirect('/complaints');
  }),
};

module.exports = complaintController;
