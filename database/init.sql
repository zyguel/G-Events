-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.AddOn (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  name character varying,
  description text,
  image_path character varying,
  has_variants boolean DEFAULT false,
  CONSTRAINT AddOn_pkey PRIMARY KEY (id),
  CONSTRAINT AddOn_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.AddOnRedemption (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  registration_id integer,
  entitlement_id integer,
  add_on_variant_id integer,
  qty integer NOT NULL,
  redeemed_at timestamp with time zone DEFAULT now(),
  station character varying,
  scanned_by character varying,
  CONSTRAINT AddOnRedemption_pkey PRIMARY KEY (id),
  CONSTRAINT AddOnRedemption_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id),
  CONSTRAINT AddOnRedemption_entitlement_id_fkey FOREIGN KEY (entitlement_id) REFERENCES public.AttendeeEntitlement(id),
  CONSTRAINT AddOnRedemption_add_on_variant_id_fkey FOREIGN KEY (add_on_variant_id) REFERENCES public.AddOnVariant(id)
);
CREATE TABLE public.AddOnTicket (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  add_on_id integer NOT NULL,
  ticket_id integer NOT NULL,
  CONSTRAINT AddOnTicket_pkey PRIMARY KEY (id),
  CONSTRAINT AddOnTicket_add_on_id_fkey FOREIGN KEY (add_on_id) REFERENCES public.AddOn(id),
  CONSTRAINT AddOnTicket_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.Ticket(id)
);
CREATE TABLE public.AddOnVariant (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  add_on_id integer,
  code character varying NOT NULL,
  label character varying,
  stock_total integer NOT NULL,
  stock_reserved integer DEFAULT 0,
  stock_redeemed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT AddOnVariant_pkey PRIMARY KEY (id),
  CONSTRAINT AddOnVariant_add_on_id_fkey FOREIGN KEY (add_on_id) REFERENCES public.AddOn(id)
);
CREATE TABLE public.AgendaSlot (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  title character varying,
  description text,
  speaker_name character varying,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  order integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT AgendaSlot_pkey PRIMARY KEY (id),
  CONSTRAINT AgendaSlot_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.AttendeeEntitlement (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  registration_id integer,
  add_on_variant_id integer,
  qty_total integer NOT NULL,
  qty_reserved integer DEFAULT 0,
  qty_redeemed integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT AttendeeEntitlement_pkey PRIMARY KEY (id),
  CONSTRAINT AttendeeEntitlement_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id),
  CONSTRAINT AttendeeEntitlement_add_on_variant_id_fkey FOREIGN KEY (add_on_variant_id) REFERENCES public.AddOnVariant(id)
);
CREATE TABLE public.AuditLog (
  id bigint NOT NULL DEFAULT nextval('"AuditLog_id_seq"'::regclass),
  entity_type text NOT NULL,
  entity_id bigint,
  action text NOT NULL,
  payload jsonb NOT NULL,
  audit_hash text NOT NULL,
  prev_hash text,
  ipfs_cid text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT AuditLog_pkey PRIMARY KEY (id)
);
CREATE TABLE public.BreakoutSession (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  name character varying,
  description text,
  start_time timestamp with time zone,
  end_time timestamp with time zone,
  speaker_name character varying,
  room_name character varying,
  room_capacity integer,
  CONSTRAINT BreakoutSession_pkey PRIMARY KEY (id),
  CONSTRAINT BreakoutSession_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.BreakoutSessionRegistration (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  breakout_session_id integer,
  registration_id integer,
  status character varying,
  check_in_time timestamp with time zone,
  ticket_token text,
  CONSTRAINT BreakoutSessionRegistration_pkey PRIMARY KEY (id),
  CONSTRAINT BreakoutSessionRegistration_breakout_session_id_fkey FOREIGN KEY (breakout_session_id) REFERENCES public.BreakoutSession(id),
  CONSTRAINT BreakoutSessionRegistration_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.Certificate (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  registration_id integer,
  file_path character varying,
  issued_at timestamp with time zone,
  blockchain_hash character varying,
  CONSTRAINT Certificate_pkey PRIMARY KEY (id),
  CONSTRAINT Certificate_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.CertificateIssue (
  id bigint NOT NULL DEFAULT nextval('"CertificateIssue_id_seq"'::regclass),
  event_id bigint NOT NULL,
  template_id bigint NOT NULL,
  registration_id bigint,
  recipient_name text NOT NULL,
  recipient_email text NOT NULL,
  access_token text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'issued'::text CHECK (status = ANY (ARRAY['queued'::text, 'issued'::text, 'sent'::text, 'failed'::text])),
  issued_at timestamp with time zone,
  sent_at timestamp with time zone,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CertificateIssue_pkey PRIMARY KEY (id),
  CONSTRAINT CertificateIssue_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id),
  CONSTRAINT CertificateIssue_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.CertificateTemplate(id),
  CONSTRAINT CertificateIssue_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.CertificateLedger (
  id bigint NOT NULL DEFAULT nextval('"CertificateLedger_id_seq"'::regclass),
  issue_id bigint NOT NULL UNIQUE,
  block_index bigint NOT NULL UNIQUE,
  previous_hash text,
  certificate_hash text NOT NULL,
  block_hash text NOT NULL UNIQUE,
  block_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CertificateLedger_pkey PRIMARY KEY (id),
  CONSTRAINT CertificateLedger_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.CertificateIssue(id)
);
CREATE TABLE public.CertificateSetting (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  template_path character varying,
  name_placeholder_position character varying,
  blockchain_issuer character varying,
  CONSTRAINT CertificateSetting_pkey PRIMARY KEY (id),
  CONSTRAINT CertificateSetting_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.CertificateTemplate (
  id bigint NOT NULL DEFAULT nextval('"CertificateTemplate_id_seq"'::regclass),
  event_id bigint NOT NULL,
  name text NOT NULL,
  background_image text NOT NULL,
  name_x integer NOT NULL DEFAULT 150,
  name_y integer NOT NULL DEFAULT 150,
  font_size integer NOT NULL DEFAULT 28,
  font_color text NOT NULL DEFAULT '#000000'::text,
  created_by_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT CertificateTemplate_pkey PRIMARY KEY (id),
  CONSTRAINT CertificateTemplate_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.Event (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  organization_id integer,
  title character varying,
  description text,
  banner_image character varying,
  event_start_at timestamp with time zone,
  event_end_at timestamp with time zone,
  location character varying,
  capacity integer,
  allow_group_registration boolean,
  allow_waitlist boolean,
  allow_breakout_sessions boolean,
  registration_open_at timestamp with time zone,
  registration_close_at timestamp with time zone,
  is_published boolean,
  confirmation_page_message text,
  confirmation_email_subject character varying,
  confirmation_email_body text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_visible boolean,
  objectives jsonb DEFAULT '[]'::jsonb,
  theme text DEFAULT ''::text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Event_pkey PRIMARY KEY (id),
  CONSTRAINT Event_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.Organization(id)
);
CREATE TABLE public.EventEmailCampaign (
  id bigint NOT NULL DEFAULT nextval('"EventEmailCampaign_id_seq"'::regclass),
  event_id bigint NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'scheduled'::text, 'sending'::text, 'sent'::text, 'failed'::text])),
  send_mode text NOT NULL DEFAULT 'attendees'::text CHECK (send_mode = ANY (ARRAY['preview'::text, 'attendees'::text])),
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipient_count integer NOT NULL DEFAULT 0,
  schedule_at timestamp with time zone,
  sent_at timestamp with time zone,
  created_by_email text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT EventEmailCampaign_pkey PRIMARY KEY (id),
  CONSTRAINT EventEmailCampaign_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.EventEmailRecipient (
  id bigint NOT NULL DEFAULT nextval('"EventEmailRecipient_id_seq"'::regclass),
  campaign_id bigint NOT NULL,
  event_id bigint NOT NULL,
  registration_id bigint,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'queued'::text CHECK (status = ANY (ARRAY['queued'::text, 'sent'::text, 'failed'::text])),
  error_message text,
  sent_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT EventEmailRecipient_pkey PRIMARY KEY (id),
  CONSTRAINT EventEmailRecipient_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.EventEmailCampaign(id),
  CONSTRAINT EventEmailRecipient_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id),
  CONSTRAINT EventEmailRecipient_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.EventWaitlistSettings (
  id bigint NOT NULL DEFAULT nextval('"EventWaitlistSettings_id_seq"'::regclass),
  event_id bigint NOT NULL UNIQUE,
  expiry_days integer NOT NULL DEFAULT 7,
  invite_type text NOT NULL DEFAULT 'auto'::text CHECK (invite_type = ANY (ARRAY['auto'::text, 'manual'::text])),
  show_position boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT EventWaitlistSettings_pkey PRIMARY KEY (id),
  CONSTRAINT EventWaitlistSettings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.FeedbackAnswer (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  feedback_form_id integer,
  registration_id integer,
  feedback_question_id integer,
  answer text,
  feedback_submission_id bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FeedbackAnswer_pkey PRIMARY KEY (id),
  CONSTRAINT FeedbackAnswer_feedback_form_id_fkey FOREIGN KEY (feedback_form_id) REFERENCES public.FeedbackForm(id),
  CONSTRAINT FeedbackAnswer_feedback_question_id_fkey FOREIGN KEY (feedback_question_id) REFERENCES public.FeedbackQuestion(id),
  CONSTRAINT FeedbackAnswer_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id),
  CONSTRAINT FeedbackAnswer_feedback_submission_id_fkey FOREIGN KEY (feedback_submission_id) REFERENCES public.FeedbackSubmission(id)
);
CREATE TABLE public.FeedbackForm (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  title character varying,
  description text,
  send_after_event_days integer,
  send_reminder_days integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FeedbackForm_pkey PRIMARY KEY (id),
  CONSTRAINT FeedbackForm_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.FeedbackQuestion (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  feedback_form_id integer,
  question_text character varying,
  input_format character varying,
  options text,
  order integer,
  is_required boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FeedbackQuestion_pkey PRIMARY KEY (id),
  CONSTRAINT FeedbackQuestion_feedback_form_id_fkey FOREIGN KEY (feedback_form_id) REFERENCES public.FeedbackForm(id)
);
CREATE TABLE public.FeedbackSubmission (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  feedback_form_id integer NOT NULL,
  event_id integer NOT NULL,
  registration_id integer,
  submitter_name text,
  submitter_email text,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT FeedbackSubmission_pkey PRIMARY KEY (id),
  CONSTRAINT FeedbackSubmission_feedback_form_id_fkey FOREIGN KEY (feedback_form_id) REFERENCES public.FeedbackForm(id),
  CONSTRAINT FeedbackSubmission_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id),
  CONSTRAINT FeedbackSubmission_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.OrderConfirmationSettings (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id bigint NOT NULL UNIQUE,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT OrderConfirmationSettings_pkey PRIMARY KEY (id),
  CONSTRAINT orderconfirmationsettings_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.OrderForm (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  title character varying,
  description text,
  form_data jsonb DEFAULT '{"sections": []}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT OrderForm_pkey PRIMARY KEY (id),
  CONSTRAINT OrderForm_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.OrderFormEntries (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id bigint NOT NULL,
  registration_id bigint,
  order_form_id bigint NOT NULL,
  user_email character varying,
  form_data jsonb NOT NULL,
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT OrderFormEntries_pkey PRIMARY KEY (id),
  CONSTRAINT orderformentries_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id),
  CONSTRAINT orderformentries_order_form_id_fkey FOREIGN KEY (order_form_id) REFERENCES public.OrderForm(id),
  CONSTRAINT orderformentries_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.OrderFormQuestion (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  section_id integer,
  question_title character varying,
  input_format character varying,
  field_identifier character varying,
  is_required boolean,
  order integer,
  CONSTRAINT OrderFormQuestion_pkey PRIMARY KEY (id),
  CONSTRAINT OrderFormQuestion_section_id_fkey FOREIGN KEY (section_id) REFERENCES public.OrderFormSection(id)
);
CREATE TABLE public.OrderFormSection (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  order_form_id integer,
  title character varying,
  image_path character varying,
  order integer,
  CONSTRAINT OrderFormSection_pkey PRIMARY KEY (id),
  CONSTRAINT OrderFormSection_order_form_id_fkey FOREIGN KEY (order_form_id) REFERENCES public.OrderForm(id)
);
CREATE TABLE public.Organization (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  description character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT Organization_pkey PRIMARY KEY (id)
);
CREATE TABLE public.OrganizationPermission (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  category character varying,
  CONSTRAINT OrganizationPermission_pkey PRIMARY KEY (id)
);
CREATE TABLE public.OrganizationRole (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  organization_id integer,
  name character varying,
  description character varying,
  CONSTRAINT OrganizationRole_pkey PRIMARY KEY (id),
  CONSTRAINT OrganizationRole_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.Organization(id)
);
CREATE TABLE public.OrganizationRolePermission (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  organization_role_id integer,
  organization_permission_id integer,
  CONSTRAINT OrganizationRolePermission_pkey PRIMARY KEY (id),
  CONSTRAINT OrganizationRolePermission_organization_permission_id_fkey FOREIGN KEY (organization_permission_id) REFERENCES public.OrganizationPermission(id),
  CONSTRAINT OrganizationRolePermission_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.OrganizationRole(id)
);
CREATE TABLE public.OrganizationUserRole (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  organization_id integer,
  user_id integer,
  organization_role_id integer,
  CONSTRAINT OrganizationUserRole_pkey PRIMARY KEY (id),
  CONSTRAINT OrganizationUserRole_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.Organization(id),
  CONSTRAINT OrganizationUserRole_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.OrganizationRole(id),
  CONSTRAINT OrganizationUserRole_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.User(id)
);
CREATE TABLE public.PaymentProof (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  registration_id integer,
  registration_group_id integer,
  file_path character varying,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  remarks character varying,
  CONSTRAINT PaymentProof_pkey PRIMARY KEY (id),
  CONSTRAINT PaymentProof_registration_group_id_fkey FOREIGN KEY (registration_group_id) REFERENCES public.RegistrationGroup(id),
  CONSTRAINT PaymentProof_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.Permission (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  category character varying,
  CONSTRAINT Permission_pkey PRIMARY KEY (id)
);
CREATE TABLE public.Promotion (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  name character varying,
  code character varying,
  discount_type character varying,
  discount_value numeric,
  max_uses integer,
  current_uses integer,
  start_at timestamp with time zone,
  end_at timestamp with time zone,
  is_automatic boolean,
  CONSTRAINT Promotion_pkey PRIMARY KEY (id),
  CONSTRAINT Promotion_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.PromotionTicket (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  promotion_id integer,
  ticket_id integer,
  CONSTRAINT PromotionTicket_pkey PRIMARY KEY (id),
  CONSTRAINT PromotionTicket_promotion_id_fkey FOREIGN KEY (promotion_id) REFERENCES public.Promotion(id),
  CONSTRAINT PromotionTicket_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.Ticket(id)
);
CREATE TABLE public.Registration (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  ticket_id integer,
  registration_group_id integer,
  user_id integer,
  status character varying,
  final_price_paid numeric,
  has_breakout_session_registration boolean,
  has_checked_in boolean,
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_waitlisted boolean,
  ticket_token text,
  profile_pending boolean NOT NULL DEFAULT false,
  CONSTRAINT Registration_pkey PRIMARY KEY (id),
  CONSTRAINT Registration_registration_group_id_fkey FOREIGN KEY (registration_group_id) REFERENCES public.RegistrationGroup(id),
  CONSTRAINT Registration_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.Ticket(id),
  CONSTRAINT Registration_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.User(id),
  CONSTRAINT Registration_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.RegistrationAnswer (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  registration_id integer,
  question_id integer,
  answer text,
  CONSTRAINT RegistrationAnswer_pkey PRIMARY KEY (id),
  CONSTRAINT RegistrationAnswer_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.OrderFormQuestion(id),
  CONSTRAINT RegistrationAnswer_registration_id_fkey FOREIGN KEY (registration_id) REFERENCES public.Registration(id)
);
CREATE TABLE public.RegistrationGroup (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  ticket_id integer,
  payer_registration_id integer,
  total_amount_paid numeric,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT RegistrationGroup_pkey PRIMARY KEY (id),
  CONSTRAINT RegistrationGroup_payer_registration_id_fkey FOREIGN KEY (payer_registration_id) REFERENCES public.Registration(id),
  CONSTRAINT RegistrationGroup_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.Ticket(id),
  CONSTRAINT RegistrationGroup_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.Role (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  description character varying,
  CONSTRAINT Role_pkey PRIMARY KEY (id)
);
CREATE TABLE public.RolePermission (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  role_id integer,
  permission_id integer,
  CONSTRAINT RolePermission_pkey PRIMARY KEY (id),
  CONSTRAINT RolePermission_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.Permission(id),
  CONSTRAINT RolePermission_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.Role(id)
);
CREATE TABLE public.Ticket (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  name character varying,
  description text,
  price numeric,
  available_quantity integer,
  selling_start_at timestamp with time zone,
  selling_end_at timestamp with time zone,
  selling_start_time time without time zone,
  selling_end_time time without time zone,
  is_hidden boolean NOT NULL DEFAULT false,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamp with time zone,
  waitlist_reserved_quantity integer NOT NULL DEFAULT 0 CHECK (waitlist_reserved_quantity >= 0),
  free_ticket_approval_mode character varying NOT NULL DEFAULT 'manual'::character varying CHECK (free_ticket_approval_mode::text = ANY (ARRAY['manual'::character varying, 'automatic'::character varying]::text[])),
  CONSTRAINT Ticket_pkey PRIMARY KEY (id),
  CONSTRAINT Ticket_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);
CREATE TABLE public.User (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  name character varying,
  email character varying UNIQUE,
  password_hash character varying,
  google_id character varying,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  preferred_language character varying NOT NULL DEFAULT 'en'::character varying CHECK (preferred_language::text ~ '^[a-z]{2,8}(-[a-z0-9]{2,8})?$'::text),
  preferred_region character varying NOT NULL DEFAULT 'US'::character varying CHECK (preferred_region::text ~ '^[A-Z]{2,8}$'::text),
  CONSTRAINT User_pkey PRIMARY KEY (id)
);
CREATE TABLE public.UserRole (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id integer,
  role_id integer,
  CONSTRAINT UserRole_pkey PRIMARY KEY (id),
  CONSTRAINT UserRole_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.Role(id),
  CONSTRAINT UserRole_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.User(id)
);
CREATE TABLE public.WaitlistEntry (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL,
  event_id integer,
  ticket_id integer,
  email character varying,
  status character varying,
  invite_sent_at timestamp with time zone,
  invite_expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT WaitlistEntry_pkey PRIMARY KEY (id),
  CONSTRAINT WaitlistEntry_ticket_id_fkey FOREIGN KEY (ticket_id) REFERENCES public.Ticket(id),
  CONSTRAINT WaitlistEntry_event_id_fkey FOREIGN KEY (event_id) REFERENCES public.Event(id)
);