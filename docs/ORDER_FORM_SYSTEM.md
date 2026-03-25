# Order Form System Documentation

## Overview
The Order Form system has been completely refactored to support a comprehensive set of input types, flexible field identifiers, and database integration for storing form submissions.

## Key Changes

### 1. Updated Input Types
The component now supports 10 input types instead of 8:

- **short_answer** - Single line text input (replaces "text")
- **paragraph** - Multi-line text area (replaces "textarea")
- **multiple_choice** - Radio buttons for single selection (replaces "radio")
- **checkboxes** - Multiple checkboxes for multi-select
- **dropdown** - Select dropdown menu (replaces "select")
- **file_upload** - File upload input with drag-and-drop UI
- **multiple_choice_grid** - Grid layout with radio buttons for rows
- **checkbox_grid** - Grid layout with checkboxes for rows
- **date** - Date picker input
- **time** - Time picker input

### 2. Field Identifiers Dropdown
Field identifiers are now a dropdown instead of free-text input. This ensures consistency and enables proper data mapping.

**Available field identifiers:**
- Personal Info: `first_name`, `last_name`, `email`, `phone`
- Demographics: `gender`, `age`, `date_of_birth`
- Address: `address`, `city`, `state`, `country`, `zip_code`
- Professional: `company`, `job_title`, `department`
- Special: `dietary_restrictions`, `special_needs`, `agree_to_terms`, `newsletter_signup`
- Custom: `custom` (for custom fields not in the list)

### 3. Database Integration

#### OrderFormEntries Table
A new table stores all form submissions with JSONB data:

```sql
CREATE TABLE public.OrderFormEntries (
    id bigint PRIMARY KEY,
    event_id bigint,
    registration_id bigint,
    order_form_id bigint,
    user_email varchar,
    form_data jsonb,
    submitted_at timestamp,
    created_at timestamp,
    updated_at timestamp
);
```

#### JSONB Form Data Structure
The `form_data` column stores submissions in this structure:

```json
{
  "sections": [
    {
      "id": "section-1234",
      "title": "Personal Information",
      "inputs": [
        {
          "id": "input-5678",
          "question": "First Name",
          "type": "short_answer",
          "fieldIdentifier": "first_name",
          "answer": "John"
        },
        {
          "id": "input-5679",
          "question": "Email",
          "type": "short_answer",
          "fieldIdentifier": "email",
          "answer": "john@example.com"
        },
        {
          "id": "input-5680",
          "question": "Dietary Preferences",
          "type": "checkboxes",
          "fieldIdentifier": "dietary_restrictions",
          "answers": ["Vegetarian", "Gluten-free"]
        }
      ]
    }
  ]
}
```

## Usage in Components

### OrderForm Component (`components/admin/OrderForm.tsx`)
The admin form builder for creating custom forms.

**Features:**
- Add/edit/delete sections
- Add/edit/delete form fields
- Preview mode to see form as users will see it
- Support for conditional option fields (dropdown, checkboxes, multiple_choice, grids)
- Field identifier dropdown for standardized field mapping

### Server Actions (`lib/actions/orderForm.ts`)

#### saveOrderFormEntry()
Save a user's form submission to the database.

```typescript
const result = await saveOrderFormEntry(
    eventId: number,
    orderFormId: number,
    formData: OrderFormData,
    userEmail?: string,
    registrationId?: number
);
```

#### getOrderFormEntriesByEvent()
Retrieve all form entries for an event.

```typescript
const result = await getOrderFormEntriesByEvent(eventId: number);
```

#### getOrderFormEntriesByForm()
Retrieve all entries for a specific form.

```typescript
const result = await getOrderFormEntriesByForm(orderFormId: number);
```

#### getOrderFormEntry()
Retrieve a single entry by ID.

```typescript
const result = await getOrderFormEntry(entryId: number);
```

#### deleteOrderFormEntry()
Delete a form entry.

```typescript
const result = await deleteOrderFormEntry(entryId: number, eventId: number);
```

#### generateOrderFormEntriesCSV()
Export all entries for a form as CSV.

```typescript
const result = await generateOrderFormEntriesCSV(orderFormId: number);
// result.csv contains CSV string
```

## Type Definitions

### FormInputType
Union type for all supported input types:
```typescript
type FormInputType = 
  | "short_answer" 
  | "paragraph" 
  | "multiple_choice" 
  | "checkboxes" 
  | "dropdown" 
  | "file_upload" 
  | "multiple_choice_grid" 
  | "checkbox_grid" 
  | "date" 
  | "time";
```

### FieldIdentifierType
Union type for all supported field identifiers.

### FormInputField
Represents a single form question:
```typescript
interface FormInputField {
    id: string;
    question: string;
    type: FormInputType;
    fieldIdentifier: FieldIdentifierType;
    required: boolean;
    options?: string[];
}
```

### FormSection
A group of related form questions:
```typescript
interface FormSection {
    id: string;
    title: string;
    description: string;
    inputs: FormInputField[];
}
```

### OrderFormData
Complete form structure:
```typescript
interface OrderFormData {
    sections: FormSection[];
}
```

### OrderFormEntry
A submitted form response stored in database:
```typescript
interface OrderFormEntry {
    id: number;
    event_id: number;
    registration_id?: number;
    order_form_id: number;
    user_email?: string;
    form_data: OrderFormData;
    submitted_at: string;
    created_at: string;
    updated_at: string;
}
```

## Implementation Workflow

### 1. Creating a Form (Admin)
1. Navigate to event → Order Forms
2. Create sections and add fields
3. For each field:
   - Enter question text
   - Select input type from dropdown
   - Select field identifier from dropdown
   - (If needed) Add options for dropdown/checkboxes/multiple_choice/grids
   - Mark as required if needed
4. Preview before saving

### 2. Displaying Form to Users
1. Fetch the OrderForm record from database
2. Render FormSection and FormInputField components based on `form_data`
3. Collect user input into FormInputField.answer (string or string[])
4. On submit, call `saveOrderFormEntry()`

### 3. Viewing Submissions
1. Fetch entries with `getOrderFormEntriesByForm()`
2. Display entries in a table/list UI
3. Parse `form_data` to display responses
4. Export to CSV using `generateOrderFormEntriesCSV()`

## Database Migration

To add required event feature tables (including OrderFormEntries), run:

```bash
psql -h your-host -U your-user -d your-db -f database/add_combined_event_feature_tables.sql
```

Or in Supabase SQL editor, copy the contents of `database/add_combined_event_feature_tables.sql` and execute.

Superseded script (kept for reference): `database/add_order_form_entries_table.sql`.

## Input Rendering Examples

### Short Answer
```
[Text Input Field]
```

### Paragraph
```
[Multi-line Text Area]
```

### Multiple Choice (Radio)
```
○ Option 1
○ Option 2
○ Option 3
```

### Checkboxes
```
☐ Option 1
☐ Option 2
☐ Option 3
```

### Dropdown
```
[Select an option ▼]
  - Option 1
  - Option 2
  - Option 3
```

### File Upload
```
[Click to upload file] (Drag & drop area)
```

### Grid Types
Both grid types display options as column headers and rows as row labels, with radio buttons or checkboxes in cells.

```
         | Option 1 | Option 2 | Option 3
---------|----------|----------|----------
Row 1    |    ○     |    ○     |    ○
Row 2    |    ○     |    ○     |    ○
```

## Future Enhancements

- File storage integration for file_upload type
- Conditional field display based on previous answers
- Field validation rules (min/max length, regex patterns)
- Calculated fields and computed responses
- Form analytics dashboard
- Email notifications on form submission
- Integration with registration flow
