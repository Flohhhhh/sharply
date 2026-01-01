"use client";

import { useEffect, useMemo, useState } from "react";
import ApertureInput from "./aperture-input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";

export interface LensApertureChange {
	maxApertureWide: number | null;
	minApertureWide: number | null;
	maxApertureTele: number | null;
	minApertureTele: number | null;
	isVariable: boolean;
}

export interface LensApertureInputProps {
	id?: string;
	label?: string;
	maxApertureWide?: number | null;
	minApertureWide?: number | null;
	maxApertureTele?: number | null;
	minApertureTele?: number | null;
	onChange: (values: LensApertureChange) => void;
	disabled?: boolean;
	className?: string;
}

/**
 * LensApertureInput
 *
 * Renders aperture controls for lenses with optional variable aperture across the zoom range.
 * Layout:
 * - When variable=false: Max (single), toggle, Min (single)
 * - When variable=true: two columns (Wide | Tele) with Max row and Min row
 */
export default function LensApertureInput({
	id = "lens-aperture",
	label = "Aperture",
	maxApertureWide,
	minApertureWide,
	maxApertureTele,
	minApertureTele,
	onChange,
	disabled = false,
	className = "",
}: LensApertureInputProps) {
	const initialIsVariable = useMemo(() => {
		const hasTele =
			typeof maxApertureTele === "number" ||
			typeof minApertureTele === "number";
		const differs =
			(typeof maxApertureTele === "number" &&
				maxApertureTele !== maxApertureWide) ||
			(typeof minApertureTele === "number" &&
				minApertureTele !== minApertureWide);
		return hasTele || differs;
	}, [maxApertureTele, minApertureTele, maxApertureWide, minApertureWide]);

	const [isVariable, setIsVariable] = useState<boolean>(initialIsVariable);

	useEffect(() => {
		setIsVariable(initialIsVariable);
	}, [initialIsVariable]);

	const emit = (
		next: Partial<Omit<LensApertureChange, "isVariable">>,
		nextIsVariable = isVariable,
	) => {
		const pick = <T,>(incoming: T | undefined, fallback: T | null): T | null =>
			incoming !== undefined ? incoming : fallback;
		const payload: LensApertureChange = {
			maxApertureWide: pick(next.maxApertureWide, maxApertureWide ?? null),
			minApertureWide: pick(next.minApertureWide, minApertureWide ?? null),
			maxApertureTele: pick(next.maxApertureTele, maxApertureTele ?? null),
			minApertureTele: pick(next.minApertureTele, minApertureTele ?? null),
			isVariable: nextIsVariable,
		};

		// If not variable, prefer leaving tele values null so unknowns can be omitted
		if (!nextIsVariable) {
			payload.maxApertureTele = null;
			payload.minApertureTele = null;
		}

		onChange(payload);
	};

	// Inline validation (no auto-adjustments)
	const n = (v: unknown): number | null =>
		typeof v === "number" && Number.isFinite(v) ? (v as number) : null;
	const wideMaxVal = n(maxApertureWide);
	const wideMinVal = n(minApertureWide);
	const teleMaxVal = n(maxApertureTele);
	const teleMinVal = n(minApertureTele);

	const widePairError =
		wideMaxVal != null && wideMinVal != null && wideMinVal < wideMaxVal
			? "Narrowest aperture must narrower or equal to widest aperture"
			: null;
	const telePairError =
		isVariable &&
		teleMaxVal != null &&
		teleMinVal != null &&
		teleMinVal < teleMaxVal
			? "Narrowest aperture must be narrower or equal to widest aperture"
			: null;
	const teleVsWideMaxError =
		isVariable &&
		wideMaxVal != null &&
		teleMaxVal != null &&
		teleMaxVal < wideMaxVal
			? "Tele max must be ≥ wide max"
			: null;
	const teleVsWideMinError =
		isVariable &&
		wideMinVal != null &&
		teleMinVal != null &&
		teleMinVal < wideMinVal
			? "Tele min must be ≥ wide min"
			: null;

	return (
		<div id={id} data-force-ring-container className={`w-full ${className}`}>
			<div className="space-y-2">
				<Label htmlFor={id}>{label}</Label>
			</div>

			{/* Compact single-column layout when not variable */}
			{!isVariable ? (
				<div className="mt-2 space-y-4">
					<ApertureInput
						id={`${id}-max-wide`}
						label="Maximum Aperture (widest)"
						value={
							typeof maxApertureWide === "number" ? maxApertureWide : undefined
						}
						onChange={(val) =>
							emit({
								maxApertureWide: val ?? null,
								maxApertureTele: val ?? null,
							})
						}
						disabled={disabled}
					/>

					<div className="flex items-center gap-3">
						<Switch
							id={`${id}-variable`}
							checked={isVariable}
							onCheckedChange={(checked) => {
								setIsVariable(checked);
								emit({}, checked);
							}}
							disabled={disabled}
						/>
						<Label htmlFor={`${id}-variable`} className="text-sm">
							Variable aperture across zoom
						</Label>
					</div>

					<ApertureInput
						id={`${id}-min-wide`}
						label="Minimum Aperture (narrowest)"
						value={
							typeof minApertureWide === "number" ? minApertureWide : undefined
						}
						onChange={(val) =>
							emit({
								minApertureWide: val ?? null,
								minApertureTele: val ?? null,
							})
						}
						disabled={disabled}
					/>
					{widePairError ? (
						<p className="text-destructive text-sm">{widePairError}</p>
					) : null}
				</div>
			) : (
				// Two-column grid when variable
				<div className="mt-2 space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<ApertureInput
							id={`${id}-max-wide`}
							label="Max (Wide)"
							value={
								typeof maxApertureWide === "number"
									? maxApertureWide
									: undefined
							}
							onChange={(val) => emit({ maxApertureWide: val ?? null })}
							disabled={disabled}
						/>
						<ApertureInput
							id={`${id}-max-tele`}
							label="Max (Tele)"
							placeholder="e.g. 6.3"
							value={
								typeof maxApertureTele === "number"
									? maxApertureTele
									: undefined
							}
							onChange={(val) => emit({ maxApertureTele: val ?? null })}
							disabled={disabled}
						/>
					</div>
					{teleVsWideMaxError ? (
						<p className="text-destructive text-sm">{teleVsWideMaxError}</p>
					) : null}

					<div className="flex items-center gap-3">
						<Switch
							id={`${id}-variable`}
							checked={isVariable}
							onCheckedChange={(checked) => {
								setIsVariable(checked);
								emit({}, checked);
							}}
							disabled={disabled}
						/>
						<Label htmlFor={`${id}-variable`} className="text-sm">
							Variable aperture across zoom
						</Label>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<ApertureInput
							id={`${id}-min-wide`}
							label="Min (Wide)"
							placeholder="e.g. 16"
							value={
								typeof minApertureWide === "number"
									? minApertureWide
									: undefined
							}
							onChange={(val) => emit({ minApertureWide: val ?? null })}
							disabled={disabled}
						/>
						<ApertureInput
							id={`${id}-min-tele`}
							label="Min (Tele)"
							placeholder="e.g. 22"
							value={
								typeof minApertureTele === "number"
									? minApertureTele
									: undefined
							}
							onChange={(val) => emit({ minApertureTele: val ?? null })}
							disabled={disabled}
						/>
					</div>
					{widePairError ? (
						<p className="text-destructive text-sm">{widePairError}</p>
					) : null}
					{telePairError ? (
						<p className="text-destructive text-sm">{telePairError}</p>
					) : null}
					{teleVsWideMinError ? (
						<p className="text-destructive text-sm">{teleVsWideMinError}</p>
					) : null}
				</div>
			)}
		</div>
	);
}
