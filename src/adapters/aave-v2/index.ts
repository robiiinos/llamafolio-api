import { Adapter } from '@lib/adapter'

import * as avax from './avax'
import * as ethereum from './ethereum'
import * as polygon from './polygon'

const adapter: Adapter = {
  id: 'aave-v2',
  avax,
  ethereum,
  polygon,
}

export default adapter