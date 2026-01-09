import httpStatus from "http-status";
import { Contact } from "./contact.model";
import QueryBuilder from "../../utils/QueryBuilder";
import { IContact } from "./contact.interface";
import AppError from "../../errorHelpers/AppError";
import { sendEmail } from "../../utils/sendEmail";

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
    .sort(["createdAt", "name", "email", "subject"])
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

  // Validate status transition
  if (contact.status === "RESOLVED") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot update a resolved contact message"
    );
  }

  if (contact.status === "IN_PROGRESS" && payload.status === "PENDING") {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot revert status from IN_PROGRESS to PENDING"
    );
  }

  const result = await Contact.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  // Send email notification
  if (result) {
    try {
      await sendEmail({
        to: result.email,
        subject: `Update on your inquiry: ${result.subject}`,
        templateName: "contactResponse",
        templateData: {
          name: result.name,
          subject: result.subject,
          status: result.status,
          adminResponse: payload.adminResponse || "",
        },
      });
    } catch (error) {
      console.error("Failed to send contact update email:", error);
      // We don't throw here to avoid rolling back the status update if email fails
    }
  }

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
