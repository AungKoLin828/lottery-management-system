interface Props {
  title: string;
  value: string;
  icon?: string;
}

export default function SummaryCard({ title, value, icon }: Props) {
  return (
    <div
      className="
      bg-white
      rounded-xl
      shadow
      p-5
      flex
      justify-between
      items-center
      "
    >
      <div>
        <p className="text-gray-500">{title}</p>

        <h2
          className="
        text-2xl
        font-bold
        mt-2
        "
        >
          {value}
        </h2>
      </div>

      <div
        className="
      text-4xl
      "
      >
        {icon}
      </div>
    </div>
  );
}
