import type { ContactModel, IContact } from '../types/Contact.types';
import type { ServiceConfig } from '../../configs';

class Contact implements IContact {
    private readonly _serviceConfig: ServiceConfig;

    constructor(rawContact: ContactModel, { serviceConfig }: { serviceConfig: ServiceConfig }) {
        Object.assign(this, rawContact);
        this._serviceConfig = serviceConfig;
    }

    async sendMessage() {
        throw new Error('Method not implemented.');
    }

    get serviceConfig(): ServiceConfig {
        return this._serviceConfig;
    }
}

export function createContact(rawContact: ContactModel, { serviceConfig }: { serviceConfig: ServiceConfig }): IContact {
    return new Contact(rawContact, { serviceConfig });
}