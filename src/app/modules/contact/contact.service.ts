import httpStatus from "http-status";
import { Contact } from "./contact.model";
import QueryBuilder from "../../utils/QueryBuilder";
import { IContact } from "./contact.interface";
import AppError from "../../errorHelpers/AppError";

// Create a new contact message
const createContact = async (payload: IContact) => {
  const result = await Contact.create(payload);
  return result;
};

// Get all contact messages (Admin only) with filtering, sorting, pagination
const getAllContacts = async (query: Record<string, unknown>) => {
  const contactQuery = new QueryBuilder(Contact.find(), query)
    .search(["name", "email", "subject"])
    .filter()
    .sort()
    .paginate()
    .fields();

  const result = await contactQuery.execute();

  return result;
};

// Get a single contact message by ID
const getContactById = async (id: string) => {
  const result = await Contact.findById(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact message not found");
  }
  return result;
};

// Update contact status and admin response (Admin only)
const updateContactStatus = async (
  id: string,
  payload: {
    status: "PENDING" | "IN_PROGRESS" | "RESOLVED";
    adminResponse?: string;
  }
) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact message not found");
  }

  const result = await Contact.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  return result;
};

// Delete a contact message (Admin only)
const deleteContact = async (id: string) => {
  const contact = await Contact.findById(id);
  if (!contact) {
    throw new AppError(httpStatus.NOT_FOUND, "Contact message not found");
  }

  const result = await Contact.findByIdAndDelete(id);
  return result;
};

export const ContactService = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  deleteContact,
};
