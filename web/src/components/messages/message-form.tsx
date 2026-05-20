import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
	Button,
	Checkbox,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	RadioGroup,
	Radio,
	TextField,
	Typography
} from "@mui/material"
import { messageSchema, type MessageForm } from "../../schemas/message.schema"
import type { Contact } from "../../types"

interface MessageFormProps {
	contacts: Contact[]
	defaultValues?: MessageForm
	onSubmit: (data: MessageForm) => Promise<void>
}

export function MessageForm({ contacts, defaultValues, onSubmit }: MessageFormProps) {
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		control,
		formState: { errors, isSubmitting }
	} = useForm<MessageForm>({
		resolver: zodResolver(messageSchema),
		defaultValues: defaultValues ?? {
			body: "",
			contactIds: [],
			scheduleType: "imediato",
			sendAt: new Date()
		}
	})

	const selectedContactIds = watch("contactIds")

	return (
		<form data-slot="message-form" onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
			{/* Contact checkboxes */}
			<div>
				<Typography variant="subtitle2" gutterBottom>
					Contatos
				</Typography>
				<FormGroup>
					{contacts.map((contact) => (
						<FormControlLabel
							key={contact.id}
							control={
								<Checkbox
									checked={selectedContactIds.includes(contact.id)}
									onChange={(e) => {
										const next = e.target.checked
											? [...selectedContactIds, contact.id]
											: selectedContactIds.filter((id) => id !== contact.id)
										setValue("contactIds", next, { shouldValidate: true })
									}}
								/>
							}
							label={contact.name}
						/>
					))}
				</FormGroup>
				{errors.contactIds && <FormHelperText error>{errors.contactIds.message}</FormHelperText>}
			</div>

			{/* Body field */}
			<TextField
				label="Mensagem"
				multiline
				rows={4}
				error={!!errors.body}
				helperText={errors.body?.message}
				{...register("body")}
			/>

			{/* Schedule type */}
			<div>
				<Typography variant="subtitle2" gutterBottom>
					Agendamento
				</Typography>
				<Controller
					name="scheduleType"
					control={control}
					render={({ field }) => (
						<RadioGroup {...field} row>
							<FormControlLabel value="imediato" control={<Radio />} label="Imediato" />
							<FormControlLabel value="agendado" control={<Radio />} label="Agendado" />
						</RadioGroup>
					)}
				/>
			</div>

			{/* sendAt field — only shown when scheduleType === 'agendado' */}
			{watch("scheduleType") === "agendado" && (
				<TextField
					type="datetime-local"
					label="Data e hora"
					error={!!errors.sendAt}
					helperText={errors.sendAt?.message}
					slotProps={{ inputLabel: { shrink: true } }}
					{...register("sendAt", { valueAsDate: true })}
				/>
			)}

			<Button
				type="submit"
				variant="contained"
				disabled={isSubmitting}
				className="focus-visible:outline-none focus-visible:ring-2"
			>
				{isSubmitting ? "Enviando..." : "Enviar"}
			</Button>
		</form>
	)
}
