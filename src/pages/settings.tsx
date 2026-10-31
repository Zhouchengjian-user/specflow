import { isDemo } from "@/lib/demo"
import { useState } from "react"

import { Callout, Screen, ScrollBody, TopBar, useSettings } from "@/components/common"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { api } from "@/lib/api"
import { cn } from "@/lib/utils"

export function SettingsPage() {
  const { settings, reload } = useSettings()
  const [provider, setProvider] = useState(settings.provider || "deepseek")
  const providerOf = (key: string) => settings.providers.find((p) => p.key === key)!
  const [model, setModel] = useState(
    settings.provider && settings.model ? settings.model : providerOf(provider).model,
  )
  const [key, setKey] = useState("")
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const choose = (k: string) => {
    setProvider(k)
    setModel(providerOf(k).model)
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setMsg(null)
    try {
      const res = await api.saveSettings({ provider, api_key: key, model })
      setMsg({
        ok: res.ok,
        text: res.ok ? res.message : `${res.message}。请检查 Key 是否复制完整、账户是否有余额。`,
      })
      if (res.ok) {
        setKey("")
        await reload()
      }
    } catch (err) {
      setMsg({ ok: false, text: (err as Error).message })
    }
    setBusy(false)
  }

  const current = providerOf(provider)

  return (
    <Screen>
      <TopBar title="模型设置" />
      <ScrollBody className="max-w-2xl">
        <div className="settings-hero"><h1>连接你的智能引擎</h1><p className="mb-6 text-sm text-muted-foreground">
          引擎靠大模型对话和推导方案。一份方案约 6 次调用、4 万 tokens；每次推导最多 16 次调用，超了会自动停下，不会无限扣费。
        </p></div>
        {settings.mock && (
          <Callout tone="warn" title="离线演示模式">
            {isDemo ? "当前只保存服务商与模型偏好，不保存或传输 API Key，也不测试真实连接。接入原 Python 引擎后可启用真实推导。" : "当前引擎以离线模式运行。配置将保存在本机 .env，正常启动后生效。"}
          </Callout>
        )}

        <form onSubmit={submit} className="settings-panel space-y-6">
          <section>
            <div className="mb-3 text-sm font-medium">模型服务商</div>
            <div className="grid gap-2 sm:grid-cols-3">
              {settings.providers.map((p) => (
                <button
                  type="button"
                  key={p.key}
                  onClick={() => choose(p.key)}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    provider === p.key ? "border-foreground bg-card" : "hover:bg-muted/60",
                  )}
                >
                  <div className="font-medium">{p.name}</div>
                  <div className="mt-0.5 font-mono text-xs text-muted-foreground">{p.model}</div>
                </button>
              ))}
            </div>
          </section>

          <section>
            <label className="mb-2 block text-sm font-medium" htmlFor="key">API Key</label>
            <Input
              id="key"
              type="password"
              disabled={isDemo}
              autoComplete="off"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={isDemo ? "体验版无需 API Key" : settings.key_masked ? `已保存（${settings.key_masked}），不改就留空` : "把 API Key 粘贴到这里"}
              className="h-9"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              去这里申请：
              <a className="text-link hover:underline" href={current.key_page} target="_blank" rel="noopener">
                {current.key_page}
              </a>
              {isDemo ? "。体验版不接收密钥。" : "。Key 只保存在你自己电脑上的 .env 文件里。"}
            </p>
          </section>

          <section>
            <label className="mb-2 block text-sm font-medium" htmlFor="model">模型名</label>
            <Input id="model" value={model} onChange={(e) => setModel(e.target.value)} className="h-9 font-mono" />
            <p className="mt-2 text-xs text-muted-foreground">一般用默认的就行。</p>
          </section>

          <div className="flex flex-wrap items-center gap-3 border-t pt-5">
            <Button type="submit" disabled={busy}>
              {busy ? "正在保存…" : isDemo ? "保存演示偏好" : "测试连接并保存"}
            </Button>
            {msg && <span className={cn("text-sm", msg.ok ? "text-ok" : "text-destructive")}>{msg.text}</span>}
          </div>
        </form>
      </ScrollBody>
    </Screen>
  )
}
