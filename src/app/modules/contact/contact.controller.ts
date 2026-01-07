import httpStatus from "http-status";
import { ContactService } from "./contact.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

// Create a new contact message (Public)
const createContact = catchAsync(async (req, res) => {
  const result = await ContactService.createContact(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Contact message sent successfully! We'll get back to you soon.",
    data: result,
  });
});

// Get all contact messages (Admin only)
const getAllContacts = catchAsync(async (req, res) => {
  const result = await ContactService.getAllContacts(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact messages retrieved successfully",
    meta: result.meta,
    data: result.data,
  });
});

// Get a single contact message by ID (Admin only)
const getContactById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContactService.getContactById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact message retrieved successfully",
    data: result,
  });
});

// Update contact status (Admin only)
const updateContactStatus = catchAsync(async (req, res) => {
  const { id } = req.params;
  const result = await ContactService.updateContactStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact status updated successfully",
    data: result,
  });
});

// Delete a contact message (Admin only)
const deleteContact = catchAsync(async (req, res) => {
  const { id } = req.params;
  await ContactService.deleteContact(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Contact message deleted successfully",
    data: null,
  });
});

export const ContactController = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
