import { Adapter } from '@lib/adapter'

import * as ethereum from './ethereum'

const adapter: Adapter = {
  id: 'llama-airforce',
  ethereum,
}

export default adapter