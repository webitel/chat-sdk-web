import { getThreadManagement } from '@webitel/api-services/gen';

import type { ServiceConfig } from '../../configs';

const getThreadsService = (serviceConfig: ServiceConfig) => {
    
}

const getThreadsList = () => {
    return getThreadManagement(instance).searchThreadManagement();
}

export {
    getList: getThreadsList,
};