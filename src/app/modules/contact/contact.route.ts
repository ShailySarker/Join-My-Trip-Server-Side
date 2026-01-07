import express from "express";
import { ContactController } from "./contact.controller";
import { createContactSchema, updateContactStatusSchema } from "./contact.validation";
import { checkAuth } from "../../middlewares/checkAuth";
import { validatedRequest } from "../../middlewares/validateRequest";
import { IUserRole } from "../user/user.interface";

const router = express.Router();

// Public route - Anyone can submit a contact form
router.post(
  "/",
  validatedRequest(createContactSchema),
  ContactController.createContact
);

// Admin routes - Only admin can view and manage contact messages
router.get(
  "/",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ContactController.getAllContacts
);

router.get(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ContactController.getContactById
);

router.patch(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  validatedRequest(updateContactStatusSchema),
  ContactController.updateContactStatus
);

router.delete(
  "/:id",
  checkAuth(IUserRole.ADMIN, IUserRole.SUPER_ADMIN),
  ContactController.deleteContact
);

export const ContactRoutes = router;
