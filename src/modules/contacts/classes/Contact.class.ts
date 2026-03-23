import type { ContactModel, IContact } from '../types/Contact.types';
import type { ServiceConfig } from '../../configs';

class Contact implements IContact {
    serviceConfig: ServiceConfig;

    constructor(rawContact: ContactModel, { serviceConfig }: { serviceConfig: ServiceConfig }) {
        Object.assign(this, rawContact);
        this.serviceConfig = serviceConfig;
    }

    async sendMessage() {
        throw new Error('Method not implemented.');
    }
}

export function createContact(rawContact: ContactModel, { serviceConfig }: { serviceConfig: ServiceConfig }): Contact {
    return new Contact(rawContact, { serviceConfig });
}