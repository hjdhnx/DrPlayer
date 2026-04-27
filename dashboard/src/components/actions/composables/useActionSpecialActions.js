export const createSpecialCategory = (actionData) => ({
  tid: actionData.tid,
  type_id: actionData.tid,
  name: actionData.name,
  type_name: actionData.name || `搜索: ${actionData.tid}`,
  isSpecialCategory: true,
  actionData
})

export const useActionSpecialActions = ({ emit, close, toast } = {}) => {
  const handleSpecialAction = async (actionData) => {
    const actionId = actionData?.actionId

    switch (actionId) {
      case '__self_search__': {
        if (!actionData.tid) {
          toast?.('源内搜索参数不完整：缺少tid', 'error')
          close?.()
          return
        }

        toast?.(actionData.msg || '执行源内搜索', 'info')
        emit?.('special-action', '__self_search__', createSpecialCategory(actionData))
        close?.()
        return
      }

      case '__detail__':
        toast?.('跳转到详情页', 'info')
        emit?.('special-action', 'detail', actionData)
        close?.()
        return

      case '__ktvplayer__':
        toast?.('启动KTV播放', 'info')
        emit?.('special-action', 'ktv-player', actionData)
        close?.()
        return

      case '__refresh_list__':
        toast?.('刷新列表', 'info')
        emit?.('special-action', 'refresh-list', actionData)
        close?.()
        return

      case '__copy__':
        if (actionData.content) {
          try {
            await navigator.clipboard.writeText(actionData.content)
            toast?.('已复制到剪切板', 'success')
          } catch (error) {
            toast?.('复制失败', 'error')
          }
        }
        close?.()
        return

      case '__close__':
        close?.()
        return

      case '__keep__':
        if (actionData.msg) {
          toast?.(actionData.msg, 'info')
        }
        return

      default:
        toast?.(`未知的专项动作: ${actionId}`, 'warning')
        close?.()
    }
  }

  return {
    handleSpecialAction
  }
}
