const typeClass = 'font-ui text-type-12';
export function Controls({ darkChrome, disabled }) {
  return <section data-feature="zoom">
    <input className={cn(typeClass, darkChrome ? 'text-white/35' : 'text-color-icon-primary', 'outline-none focus:outline-none w-11')} disabled={disabled} />
    <Panel className="z-[9999] shadow-[0_4px_14px_rgba(0,0,0,0.22)]"><span>Hint</span></Panel>
    <button className={chooseStyle(disabled)}>Other</button>
  </section>;
}
