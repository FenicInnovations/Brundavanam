export default function FormField({
  label,
  name,
  type = "text",
  value,
  onChange,
  error,
  as = "input",
  rows,
  ...props
}) {
  const Component = as;

  return (
    <div>
      <label htmlFor={name} className="text-sm font-medium text-ink">
        {label}
      </label>
      <Component
        id={name}
        name={name}
        type={as === "input" ? type : undefined}
        rows={as === "textarea" ? rows ?? 4 : undefined}
        value={value}
        onChange={onChange}
        aria-invalid={!!error}
        aria-describedby={error ? `${name}-error` : undefined}
        className={`mt-1.5 w-full rounded border bg-surface px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-accent ${
          error ? "border-accent-deep" : "border-line"
        }`}
        {...props}
      />
      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-xs text-accent-deep">
          {error}
        </p>
      )}
    </div>
  );
}
