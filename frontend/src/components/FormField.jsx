export default function FormField({ label, name, error, as = 'input', children, ...props }) {
  const Component = as;
  return <div className="field"><label htmlFor={name}>{label}</label><Component id={name} name={name} aria-invalid={Boolean(error)} {...props}>{children}</Component>{error && <small className="field-error">{error}</small>}</div>;
}
