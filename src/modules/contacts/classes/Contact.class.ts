import type { ContactModel, IContact } from '../types/Contact.types';

class Contact implements IContact {
    constructor(rawContact: ContactModel) {
        Object.assign(this, rawContact);
    }

    async sendMessage() {
        throw new Error('Method not implemented.');
    }
}

export function createContact(rawContact: ContactModel): Contact {
    return new Contact(rawContact);
}